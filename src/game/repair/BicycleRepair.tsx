import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { DragSlotTask } from './tasks/DragSlotTask';
import { PumpTask, WheelTask } from './tasks/MoreTasks';
import type { TaskProps } from './tasks/TaskShell';
import { TwistTask } from './tasks/TwistTask';

/** Bicycle repairs: chain onto the gears, tighten a bolt, pump the tyre and true the wheel. */
export function bicycleTask(kind: TaskKind, props: TaskProps): ReactElement | null {
  switch (kind) {
    case 'chain':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Fit the chain',
            help: 'Drag the chain onto the big front gear, then hook the other end onto the small rear gear.',
            pieces: [
              { id: 'front', label: 'Chain loop (front)', color: '#5C5A56', icon: 'link-variant', slot: 'chainring' },
              { id: 'rear', label: 'Chain loop (rear)', color: '#6B6355', icon: 'link', slot: 'sprocket' },
            ],
            slots: [
              { id: 'sprocket', label: 'Rear gear', x: 0.25, y: 0.45, color: palette.navySoft, icon: 'cog' },
              { id: 'chainring', label: 'Front gear', x: 0.72, y: 0.45, color: palette.navySoft, icon: 'cog-outline' },
            ],
            fieldColor: '#EADBC0',
          }}
        />
      );
    case 'bolt':
      return <TwistTask {...props} config={{ title: 'Tighten the bolt', help: 'Draw circles around the bolt – clockwise tightens. Stop in the green zone so it doesn’t strip.', count: props.difficulty === 'advanced' ? 2 : 1, turns: 3, kind: 'bolt' }} />;
    case 'pump':
      return <PumpTask {...props} />;
    case 'wheel':
      return <WheelTask {...props} />;
    default:
      return null;
  }
}
