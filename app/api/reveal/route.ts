import { NextRequest, NextResponse } from 'next/server';
import { BettingState } from '../../types';
import { loadState, saveState } from '../../lib/state';

export async function GET() {
  const state = loadState();
  return NextResponse.json({
    genderRevealed: state.genderRevealed,
    revealedGender: state.revealedGender,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gender } = body;

    if (gender !== 'boy' && gender !== 'girl') {
      return NextResponse.json(
        { error: 'Invalid gender' },
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

    const newState: BettingState = {
      ...state,
      genderRevealed: true,
      revealedGender: gender,
    };

    saveState(newState);

    return NextResponse.json(newState);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reveal gender' },
      { status: 500 }
    );
  }
}
