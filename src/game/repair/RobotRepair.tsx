import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { ConnectTask } from './tasks/ConnectTask';
import { DragSlotTask } from './tasks/DragSlotTask';
import { CoolingTask, MemoryTask } from './tasks/MoreTasks';
import type { TaskProps } from './tasks/TaskShell';

/** Robot repairs: link glowing circuit nodes without overheating, insert a power cell, match memory symbols, cool the core. */
export function robotTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  switch (kind) {
    case 'circuit':
      return (
        <ConnectTask
          {...props}
          config={{ title: 'Connect the circuit', help: 'Link each glowing node to its twin. The core heats up while you work – mistakes make it hotter!', pairs: props.difficulty === 'advanced' ? 5 : 4, style: 'circuit', heat: true, leftLabel: 'Nodes', rightLabel: 'Ports', seed }}
        />
      );
    case 'robotBattery':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Insert the power cell',
            help: 'Tap the power cell to turn its + side up, then drag it into the robot’s hatch.',
            pieces: [{ id: 'cell', label: 'Power cell', color: palette.mustardDeep, icon: 'battery-charging-high', slot: 'hatch', flippable: true }],
            slots: [{ id: 'hatch', label: 'Battery hatch', x: 0.5, y: 0.42, color: palette.orange, icon: 'battery-outline' }],
            fieldColor: '#DCE3EC',
          }}
        />
      );
    case 'symbols':
      return <MemoryTask {...props} />;
    case 'cooling':
      return <CoolingTask {...props} />;
    default:
      return null;
  }
}
