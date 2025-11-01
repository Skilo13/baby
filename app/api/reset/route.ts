import { NextRequest, NextResponse } from 'next/server';
import { getInitialState } from '../../lib/betting';
import { resetState, saveState } from '../../lib/state';

export async function POST(request: NextRequest) {
  try {
    // Reset to initial state
    const initialState = getInitialState();
    saveState(initialState);

    return NextResponse.json({
      success: true,
      message: 'State reset successfully',
      state: initialState,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset state' },
      { status: 500 }
    );
  }
}

