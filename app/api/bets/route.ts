import { NextRequest, NextResponse } from 'next/server';
import { Bet } from '../../types';
import { addBet } from '../../lib/betting';
import { loadState, saveState } from '../../lib/state';

export async function GET() {
  const state = loadState();
  return NextResponse.json(state);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bet } = body;

    if (!bet || !bet.userId || !bet.userName || !bet.gender || !bet.amount) {
      return NextResponse.json(
        { error: 'Invalid bet data' },
        { status: 400 }
      );
    }

    const state = loadState();
    
    if (state.genderRevealed) {
      return NextResponse.json(
        { error: 'Gender has already been revealed' },
        { status: 400 }
      );
    }

    const newBet: Bet = {
      ...bet,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const newState = addBet(state, newBet);
    saveState(newState);

    return NextResponse.json(newState);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}
