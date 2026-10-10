import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { ConnectTask } from './tasks/ConnectTask';
import { DialTask } from './tasks/DialTask';
import { DragSlotTask } from './tasks/DragSlotTask';
import type { TaskProps } from './tasks/TaskShell';

/** Radio repairs: reconnect the wires, swap the battery (mind the polarity) and tune the dial. */
export function radioTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  const pairs = props.difficulty === 'easy' ? 2 : props.difficulty === 'medium' ? 3 : 4;
  switch (kind) {
    case 'wires':
      return (
        <ConnectTask
          {...props}
          config={{ title: 'Connect the wires', help: 'Drag each wire to the terminal with the same colour and symbol. Wrong ones spark, so take your time.', pairs, style: 'wire', leftLabel: 'Wires', rightLabel: 'Terminals', seed }}
        />
      );
    case 'battery':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Replace the battery',
            help: 'Tap the new battery to turn its + side up, then drag it into the clips. The old one goes in the recycling bin.',
            pieces: [
              { id: 'new', label: 'New battery', color: palette.mintDeep, icon: 'battery-plus', slot: 'clips', flippable: true },
              { id: 'old', label: 'Old battery', color: '#8A8478', icon: 'battery-alert-variant-outline', slot: 'bin' },
            ],
            slots: [
              { id: 'clips', label: 'Battery clips', x: 0.32, y: 0.42, color: palette.mintDeep, icon: 'battery-outline' },
              { id: 'bin', label: 'Recycling bin', x: 0.75, y: 0.42, color: palette.skyDeep, icon: 'recycle' },
            ],
            fieldColor: '#E9D6B4',
          }}
        />
      );
    case 'dial':
      return (
        <DialTask
          {...props}
          config={{
            title: 'Tune the dial',
            help: 'Turn the knob until the red needle sits on the glowing station. The static clears as you get close – then hold it there.',
            display: 'radio',
            dials: [{ label: 'Station', target: 0.3 + ((seed % 5) / 10) * 0.9, start: 0.08 }],
            zone: props.difficulty === 'advanced' ? 0.035 : 0.05,
            hold: 0.7,
          }}
        />
      );
    default:
      return null;
  }
}
