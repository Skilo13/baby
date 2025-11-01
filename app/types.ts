export interface Bet {
  id: string;
  userId: string;
  userName: string;
  gender: 'boy' | 'girl';
  amount: number;
  timestamp: number;
}

export interface BettingState {
  bets: Bet[];
  boyPool: number;
  girlPool: number;
  boyCoefficient: number;
  girlCoefficient: number;
  genderRevealed: boolean;
  revealedGender: 'boy' | 'girl' | null;
  totalPlayers: number;
}

export interface User {
  id: string;
  name: string;
  balance: number;
}
