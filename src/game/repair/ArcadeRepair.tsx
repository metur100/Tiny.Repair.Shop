import type { ReactElement } from 'react';

import type { TaskKind } from '@/data/types';
import { palette } from '@/theme';
import { ConnectTask } from './tasks/ConnectTask';
import { DragSlotTask } from './tasks/DragSlotTask';
import { JoystickTask, PixelsTask } from './tasks/MoreTasks';
import type { TaskProps } from './tasks/TaskShell';

/** Arcade repairs: plug the power cable into the right socket, replace buttons, fix the screen, test the joystick. */
export function arcadeTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  switch (kind) {
    case 'power':
      return (
        <ConnectTask
          {...props}
          config={{ title: 'Connect the power', help: 'Drag each plug into the socket with the matching shape and colour.', pairs: props.difficulty === 'easy' ? 2 : 3, style: 'plug', leftLabel: 'Plugs', rightLabel: 'Sockets', seed }}
        />
      );
    case 'buttons':
      return (
        <DragSlotTask
          {...props}
          config={{
            title: 'Replace the buttons',
            help: 'Drag each new button onto the empty socket of the same colour.',
            pieces: [
              { id: 'red', label: 'Red button', color: palette.coral, icon: 'circle', slot: 'r' },
              { id: 'yellow', label: 'Yellow button', color: palette.mustardDeep, icon: 'circle', slot: 'y' },
              { id: 'green', label: 'Green button', color: palette.mintDeep, icon: 'circle', slot: 'g' },
            ],
            slots: [
              { id: 'y', label: 'Yellow socket', x: 0.25, y: 0.42, color: palette.mustardDeep, icon: 'circle-outline' },
              { id: 'g', label: 'Green socket', x: 0.5, y: 0.42, color: palette.mintDeep, icon: 'circle-outline' },
              { id: 'r', label: 'Red socket', x: 0.75, y: 0.42, color: palette.coral, icon: 'circle-outline' },
            ],
            fieldColor: '#3A3550',
          }}
        />
      );
    case 'pixels':
      return <PixelsTask {...props} />;
    case 'joystick':
      return <JoystickTask {...props} />;
    default:
      return null;
  }
}
