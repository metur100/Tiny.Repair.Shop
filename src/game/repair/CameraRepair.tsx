import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { DialTask } from './tasks/DialTask';
import { DragSlotTask } from './tasks/DragSlotTask';
import { LensTask, TimingTask } from './tasks/MoreTasks';
import type { TaskProps } from './tasks/TaskShell';

/** Camera repairs: polish the lens, replace the shutter spring, align the focus rings, test the flash. */
export function cameraTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  switch (kind) {
    case 'lens':
      return <LensTask {...props} />;
    case 'spring':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Replace the shutter spring',
            help: 'Drag the new spring into the shutter slot. The tiny screw goes into the hole next to it.',
            pieces: [
              { id: 'spring', label: 'Shutter spring', color: palette.copper, icon: 'sine-wave', slot: 'slot' },
              { id: 'screw', label: 'Tiny screw', color: '#8A8478', icon: 'screw-flat-top', slot: 'hole' },
            ],
            slots: [
              { id: 'slot', label: 'Shutter slot', x: 0.36, y: 0.4, color: palette.navySoft, icon: 'camera-iris' },
              { id: 'hole', label: 'Screw hole', x: 0.68, y: 0.4, color: palette.navySoft, icon: 'circle-outline' },
            ],
            fieldColor: '#DADDE3',
          }}
        />
      );
    case 'rings':
      return (
        <DialTask
          {...props}
          config={{
            title: 'Align the focus rings',
            help: 'Turn each ring until its yellow mark points at the arrow, then hold.',
            display: 'ring',
            dials: [
              { label: 'Focus ring', target: 0.35 + (seed % 3) * 0.1, start: 0.75 },
              { label: 'Aperture ring', target: 0.55, start: 0.18 },
            ],
            zone: props.difficulty === 'advanced' ? 0.025 : 0.035,
            hold: 0.6,
          }}
        />
      );
    case 'flash':
      return <TimingTask {...props} config={{ title: 'Test the flash', help: 'The charge needle swings back and forth. Tap when it’s in the green zone to fire the flash – three good shots!', hits: 3, label: 'Fire the flash', icon: 'flash', speed: props.difficulty === 'advanced' ? 0.9 : 0.7 }} />;
    default:
      return null;
  }
}
