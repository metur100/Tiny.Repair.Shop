import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ShopScreen from '@/app/(tabs)/shop';
import WorkshopScreen from '@/app/(tabs)/workshop';
import Results from '@/app/results';
import SettingsScreen from '@/app/settings';
import { UPGRADES } from '@/data/upgrades';
import { useGameStore } from '@/store/useGameStore';
import { availableJobs } from '@/utils/unlocks';
import { job, perfectRun, resetStore } from '../helpers';

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('Workshop screen', () => {
  it('shows the HUD, the shop and the next customer', () => {
    resetStore({ coins: 345 });
    render(<WorkshopScreen />);
    expect(screen.getByText('Tiny Repair Shop')).toBeTruthy();
    expect(screen.getByLabelText('Coins: 345')).toBeTruthy();
    expect(screen.getByText(/Stage 1: First Repairs/)).toBeTruthy();
    const next = availableJobs([], 0, [])[0];
    fireEvent.press(screen.getByTestId('next-job'));
    expect(router.push).toHaveBeenCalledWith(`/customer/${next.id}`);
  });

  it('opens the daily job', () => {
    render(<WorkshopScreen />);
    fireEvent.press(screen.getByTestId('daily-job'));
    expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/^\/customer\/daily-\d{4}-\d{2}-\d{2}$/));
  });
});

describe('Shop: upgrade flow', () => {
  it('confirms, buys, spends coins and saves the upgrade', () => {
    const u = UPGRADES[0];
    resetStore({ coins: u.cost + 10 });
    render(<ShopScreen />);
    fireEvent.press(screen.getByTestId(`buy-${u.id}`));
    expect(screen.getByText(new RegExp(`Buy it for ${u.cost} coins`))).toBeTruthy();
    fireEvent.press(screen.getByTestId('modal-confirm'));
    expect(useGameStore.getState().upgrades).toContain(u.id);
    expect(useGameStore.getState().coins).toBe(10);
    expect(screen.getByLabelText(`${u.name} owned`)).toBeTruthy();
  });

  it('disables upgrades the player cannot afford', () => {
    const u = UPGRADES[0];
    resetStore({ coins: u.cost - 1 });
    render(<ShopScreen />);
    fireEvent.press(screen.getByTestId(`buy-${u.id}`));
    expect(screen.queryByText(new RegExp(`Buy it for ${u.cost} coins`))).toBeNull();
    expect(useGameStore.getState().upgrades).not.toContain(u.id);
  });
});

describe('Results screen', () => {
  it('shows stars, rewards and the customer reaction, then returns to the workshop', () => {
    const j = job();
    let outcome!: ReturnType<ReturnType<typeof useGameStore.getState>['completeJob']>;
    act(() => {
      outcome = useGameStore.getState().completeJob(j, perfectRun(j));
    });
    render(<Results />);
    expect(screen.getByText('Perfect repair!')).toBeTruthy();
    expect(screen.getByLabelText('3 of 3 stars')).toBeTruthy();
    expect(screen.getByLabelText(`${outcome.reward.coins} coins earned`)).toBeTruthy();
    expect(screen.getByText(`Added to your collection: ${j.objectName}`)).toBeTruthy();
    fireEvent.press(screen.getByTestId('results-continue'));
    expect(useGameStore.getState().pendingCoins).toBe(0);
    expect(router.replace).toHaveBeenCalledWith('/workshop');
  });
});

describe('Settings screen', () => {
  it('toggles settings', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('toggle-contrast'));
    expect(useGameStore.getState().settings.highContrast).toBe(true);
    fireEvent.press(screen.getByTestId('toggle-motion'));
    // The test store starts with reduced motion on, so the toggle turns it off.
    expect(useGameStore.getState().settings.reducedMotion).toBe(false);
    expect(screen.getByText(/Made by Medin Turkes/)).toBeTruthy();
  });

  it('resets progress only after confirmation', async () => {
    resetStore({ coins: 999, completedJobs: ['s1-1'] });
    render(<SettingsScreen />);
    fireEvent.press(screen.getByTestId('reset-progress'));
    fireEvent.press(screen.getByTestId('modal-cancel'));
    expect(useGameStore.getState().coins).toBe(999);
    fireEvent.press(screen.getByTestId('reset-progress'));
    await act(async () => {
      fireEvent.press(screen.getByTestId('modal-confirm'));
    });
    expect(useGameStore.getState().coins).toBe(60);
    expect(useGameStore.getState().completedJobs).toEqual([]);
    expect(screen.getByText('Progress reset')).toBeTruthy();
  });
});
