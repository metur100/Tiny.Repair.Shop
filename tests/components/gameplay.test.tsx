import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { JobCard } from '@/components/JobCard';
import { ProgressBar } from '@/components/ProgressBar';
import { JOBS } from '@/data/jobs';
import { CleaningCanvas } from '@/game/cleaning/CleaningCanvas';
import { ObjectTestView } from '@/game/testing/ObjectTestView';
import { createRng, hashString } from '@/utils/dateSeed';
import { job, resetStore } from '../helpers';

beforeEach(() => resetStore());

describe('JobCard', () => {
  it('shows the job and starts it', () => {
    const j = job();
    const onStart = jest.fn();
    render(<JobCard job={j} onStart={onStart} lock={null} testID="start" />);
    expect(screen.getByText(j.title)).toBeTruthy();
    expect(screen.getByLabelText(new RegExp(`Reward about ${j.reward} coins`))).toBeTruthy();
    fireEvent.press(screen.getByTestId('start'));
    expect(onStart).toHaveBeenCalled();
  });

  it('explains why a job is locked', () => {
    const j = JOBS.find((x) => x.stage === 2)!;
    render(<JobCard job={j} onStart={jest.fn()} lock={{ reason: 'stage', needed: 18 }} />);
    expect(screen.getByText(/18 reputation/)).toBeTruthy();
  });
});

describe('Cleaning', () => {
  it('progress bar exposes its value to screen readers', () => {
    render(<ProgressBar value={0.42} label="Clean" showPercent />);
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it('starts dirty and only allows finishing once clean enough', () => {
    const onDone = jest.fn();
    render(<CleaningCanvas job={job()} brush={1} onDone={onDone} reduceMotion maxParticles={0} />);
    expect(screen.getByLabelText(/0 percent clean/)).toBeTruthy();
    expect(screen.getByText('Keep cleaning')).toBeTruthy();
    fireEvent.press(screen.getByTestId('cleaning-done'));
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('Test stage mini-game', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('robot wake-up: repeating the pattern passes the test and delivers', () => {
    const robotJob = JOBS.find((j) => j.category === 'robot')!;
    const onDone = jest.fn();
    render(<ObjectTestView job={robotJob} look={robotJob.original} onDone={onDone} reduceMotion />);
    // Same pattern the component derives from the job seed.
    const rng = createRng(hashString(robotJob.id + ':test'));
    const length = 3 + { easy: 0, medium: 1, advanced: 2 }[robotJob.difficulty];
    const pattern = Array.from({ length }, () => Math.floor(rng() * 4));
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    for (const p of pattern) fireEvent.press(screen.getByTestId(`pad-${p}`));
    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(screen.getByText('It works perfectly!')).toBeTruthy();
    fireEvent.press(screen.getByTestId('test-done'));
    expect(onDone).toHaveBeenCalledWith({ passed: true, accuracy: 1 });
  });
});
