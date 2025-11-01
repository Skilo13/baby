import { BettingState } from '../types';
import { getInitialState } from './betting';

// Shared in-memory state (for single-instance deployment)
// Note: On Vercel serverless with multiple instances, this won't persist
// For production, integrate Vercel KV or a database
let bettingState: BettingState = getInitialState();

const STORAGE_KEY = 'betting_state_server';

// Try to load from a simple file-like storage (for serverless, this won't persist)
// In a real implementation, use Vercel KV, a database, or file system
export function loadState(): BettingState {
  // For serverless, we rely on in-memory state
  // The client will persist in localStorage as backup
  return bettingState;
}

export function saveState(state: BettingState): void {
  bettingState = state;
  // In serverless, this only persists for the current invocation
  // Clients should sync to localStorage
}

export function resetState(): void {
  bettingState = getInitialState();
}
