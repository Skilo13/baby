import { BettingState, Bet } from '../types';

const INITIAL_COEFFICIENT = 1.5;
const INITIAL_BALANCE = 1000;

export function calculateCoefficients(boyPool: number, girlPool: number, initialPool: number = 0): {
  boyCoefficient: number;
  girlCoefficient: number;
} {
  const totalPool = boyPool + girlPool + initialPool;
  
  if (totalPool === 0) {
    return {
      boyCoefficient: INITIAL_COEFFICIENT,
      girlCoefficient: INITIAL_COEFFICIENT,
    };
  }

  // Simple coefficient calculation: total pool / specific pool
  // This ensures the house always has a margin
  const boyCoefficient = totalPool > 0 ? Math.max(1.1, totalPool / Math.max(boyPool, 1)) : INITIAL_COEFFICIENT;
  const girlCoefficient = totalPool > 0 ? Math.max(1.1, totalPool / Math.max(girlPool, 1)) : INITIAL_COEFFICIENT;

  return {
    boyCoefficient: Math.round(boyCoefficient * 100) / 100,
    girlCoefficient: Math.round(girlCoefficient * 100) / 100,
  };
}

export function getInitialState(): BettingState {
  const coefficients = calculateCoefficients(0, 0);
  return {
    bets: [],
    boyPool: 0,
    girlPool: 0,
    boyCoefficient: coefficients.boyCoefficient,
    girlCoefficient: coefficients.girlCoefficient,
    genderRevealed: false,
    revealedGender: null,
    totalPlayers: 0,
  };
}

export function addBet(state: BettingState, bet: Bet): BettingState {
  const newBets = [...state.bets, bet];
  const boyPool = newBets.filter(b => b.gender === 'boy').reduce((sum, b) => sum + b.amount, 0);
  const girlPool = newBets.filter(b => b.gender === 'girl').reduce((sum, b) => sum + b.amount, 0);
  
  const { boyCoefficient, girlCoefficient } = calculateCoefficients(boyPool, girlPool);

  return {
    ...state,
    bets: newBets,
    boyPool,
    girlPool,
    boyCoefficient,
    girlCoefficient,
    totalPlayers: new Set(newBets.map(b => b.userId)).size,
  };
}

export function getStorageKey(userId: string): string {
  return `user_${userId}`;
}

export function getUserBalance(userId: string): number {
  if (typeof window === 'undefined') return INITIAL_BALANCE;
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return INITIAL_BALANCE;
  const user = JSON.parse(stored);
  return user.balance || INITIAL_BALANCE;
}

export function updateUserBalance(userId: string, newBalance: number, userName: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify({
    id: userId,
    name: userName,
    balance: newBalance,
  }));
}

export function getUserName(userId: string): string {
  if (typeof window === 'undefined') return 'Player';
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return 'Player';
  const user = JSON.parse(stored);
  return user.name || 'Player';
}
