import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { DialTask } from './tasks/DialTask';
import { DragSlotTask } from './tasks/DragSlotTask';
import type { TaskProps } from './tasks/TaskShell';
import { TwistTask } from './tasks/TwistTask';

const NOTES = ['E', 'A', 'D', 'G', 'B'];

/** Instrument repairs: tune the strings into range, fit a new string, tighten loose pegs. */
export function instrumentTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  switch (kind) {
    case 'tune': {
      const n = props.difficulty === 'easy' ? 2 : 3;
      return (
        <DialTask
          {...props}
          config={{
            title: 'Tune the strings',
            help: 'Turn each peg until the needle rests in the green zone, then hold. Pick the next string with the buttons.',
            display: 'tuner',
            dials: Array.from({ length: n }, (_, i) => ({ label: `${NOTES[(i + seed) % NOTES.length]} string`, target: 0.5, start: i % 2 ? 0.28 : 0.74 })),
            zone: props.difficulty === 'advanced' ? 0.035 : 0.05,
            hold: 0.6,
          }}
        />
      );
    }
    case 'restring':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Fit a new string',
            help: 'Drag the new string’s ball end to the bridge, then wind the other end onto the peg.',
            pieces: [
              { id: 'ball', label: 'String ball end', color: palette.brass, icon: 'circle-double', slot: 'bridge' },
              { id: 'end', label: 'String end', color: '#B9B5AA', icon: 'vector-line', slot: 'peg' },
            ],
            slots: [
              { id: 'peg', label: 'Tuning peg', x: 0.5, y: 0.14, color: palette.woodDark, icon: 'pin' },
              { id: 'bridge', label: 'Bridge', x: 0.5, y: 0.78, color: palette.woodDark, icon: 'minus-thick' },
            ],
            fieldColor: '#E7C9A0',
          }}
        />
      );
    case 'pegs':
      return <TwistTask {...props} config={{ title: 'Tighten the pegs', help: 'Draw circles on each loose peg until it holds firm in the green zone.', count: props.difficulty === 'advanced' ? 3 : 2, turns: 2, kind: 'peg' }} />;
    default:
      return null;
  }
}
