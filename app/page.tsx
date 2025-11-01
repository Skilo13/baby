'use client';

import { useState, useEffect } from 'react';
import { BettingState, Bet } from './types';
import { getUserBalance, updateUserBalance, getUserName, getStorageKey } from './lib/betting';
import { Baby, Heart, Trophy, Coins } from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<BettingState | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Define fetchState before useEffect so it can be called
  const fetchState = async () => {
    try {
      // Try to load from localStorage first (backup)
      const storedState = localStorage.getItem('betting_state_backup');
      let localState: BettingState | null = null;
      if (storedState) {
        try {
          localState = JSON.parse(storedState);
        } catch (e) {
          console.error('Failed to parse stored state:', e);
        }
      }

      // Fetch from API with cache-busting to ensure fresh data on mobile
      const timestamp = Date.now();
      const response = await fetch(`/api/bets?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();
      
      // The /api/bets endpoint should return the full state including reveal status
      // But we'll also check /api/reveal as a fallback to ensure we have the latest
      const revealResponse = await fetch(`/api/reveal?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const revealData = await revealResponse.json();
      
      // Merge the reveal data with the bets data to ensure we have the latest state
      let mergedState: BettingState = {
        ...data,
        genderRevealed: revealData.genderRevealed || data.genderRevealed || false,
        revealedGender: revealData.revealedGender || data.revealedGender || null,
        // Ensure bets array exists
        bets: data.bets || [],
      };

      // Always merge with local state to preserve bets (serverless might lose state)
      if (localState) {
        // Merge bets from both sources
        const serverBets = mergedState.bets || [];
        const localBets = localState.bets || [];
        
        // Combine and deduplicate bets by id
        const allBets = [...serverBets, ...localBets];
        const uniqueBets = Array.from(
          new Map(allBets.map(bet => [bet.id, bet])).values()
        ).sort((a, b) => b.timestamp - a.timestamp);

        // Use whichever has more bets (more complete state)
        const useLocalState = localBets.length > serverBets.length;
        
        // Recalculate pools from merged bets
        const boyPool = uniqueBets.filter(b => b.gender === 'boy').reduce((sum, b) => sum + b.amount, 0);
        const girlPool = uniqueBets.filter(b => b.gender === 'girl').reduce((sum, b) => sum + b.amount, 0);

        mergedState = {
          ...mergedState,
          bets: uniqueBets,
          boyPool,
          girlPool,
          // Prefer local reveal status if it exists, otherwise use server
          genderRevealed: localState.genderRevealed !== undefined ? localState.genderRevealed : mergedState.genderRevealed,
          revealedGender: localState.revealedGender || mergedState.revealedGender,
          totalPlayers: new Set(uniqueBets.map(b => b.userId)).size,
        };

        // Recalculate coefficients from merged pools
        const totalPool = boyPool + girlPool;
        if (totalPool > 0) {
          mergedState.boyCoefficient = Math.max(1.1, totalPool / Math.max(boyPool, 1));
          mergedState.girlCoefficient = Math.max(1.1, totalPool / Math.max(girlPool, 1));
        } else {
          mergedState.boyCoefficient = 1.5;
          mergedState.girlCoefficient = 1.5;
        }
        mergedState.boyCoefficient = Math.round(mergedState.boyCoefficient * 100) / 100;
        mergedState.girlCoefficient = Math.round(mergedState.girlCoefficient * 100) / 100;
      } else if (mergedState.bets && mergedState.bets.length > 0) {
        // No local state, but we have server state - recalculate pools to be safe
        const boyPool = mergedState.bets.filter(b => b.gender === 'boy').reduce((sum, b) => sum + b.amount, 0);
        const girlPool = mergedState.bets.filter(b => b.gender === 'girl').reduce((sum, b) => sum + b.amount, 0);
        mergedState.boyPool = boyPool;
        mergedState.girlPool = girlPool;
      }

      // Save to localStorage as backup
      localStorage.setItem('betting_state_backup', JSON.stringify(mergedState));
      
      setState(mergedState);
    } catch (error) {
      console.error('Failed to fetch state:', error);
      // Fallback to localStorage if API fails
      const storedState = localStorage.getItem('betting_state_backup');
      if (storedState) {
        try {
          const localState = JSON.parse(storedState);
          setState(localState);
        } catch (e) {
          console.error('Failed to load from localStorage:', e);
        }
      }
    }
  };

  useEffect(() => {
    // Initialize or load user ID
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('user_id', id);
    }
    setUserId(id);

    // Load user name
    const stored = localStorage.getItem(getStorageKey(id));
    if (stored) {
      const user = JSON.parse(stored);
      setUserName(user.name || '');
      setUserBalance(user.balance || 1000);
    } else {
      setUserBalance(1000);
    }

    // Load betting state
    fetchState();
    // Poll every 2 seconds when page is visible, use visibility API to pause when tab is hidden
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchState();
      }
    }, 2000);
    
    // Also refresh when page becomes visible (mobile browsers often pause when switching tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      updateUserBalance(userId, userBalance, userName.trim());
      setMessage('Name saved!');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const placeBet = async () => {
    if (!selectedGender || !userName.trim()) {
      setMessage('Please enter your name and select a gender!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (betAmount <= 0 || betAmount > userBalance) {
      setMessage('Invalid bet amount!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bet: {
            userId,
            userName: userName.trim(),
            gender: selectedGender,
            amount: betAmount,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const newBalance = userBalance - betAmount;
        setUserBalance(newBalance);
        updateUserBalance(userId, newBalance, userName.trim());
        
        // Merge with current state to preserve all bets
        const mergedState = {
          ...data,
          bets: data.bets || state?.bets || [],
        };
        
        setState(mergedState);
        // Save to localStorage backup
        localStorage.setItem('betting_state_backup', JSON.stringify(mergedState));
        
        setMessage('Bet placed successfully! 🎉');
        setTimeout(() => setMessage(''), 3000);
        setBetAmount(100);
        setSelectedGender(null);
      } else {
        setMessage(data.error || 'Failed to place bet');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to place bet. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getWinnings = (bet: Bet, revealedGender: 'boy' | 'girl', state: BettingState): number => {
    if (bet.gender !== revealedGender) return 0;
    
    // Use the coefficient from state, which should reflect the final pools at reveal
    // Fallback: recalculate if coefficient seems invalid
    let coefficient = bet.gender === 'boy' ? state.boyCoefficient : state.girlCoefficient;
    
    // Safety check: if coefficient is invalid, recalculate based on pools
    if (!coefficient || coefficient <= 0 || isNaN(coefficient)) {
      const totalPool = state.boyPool + state.girlPool;
      const winningPool = bet.gender === 'boy' ? state.boyPool : state.girlPool;
      coefficient = winningPool > 0 ? Math.max(1.1, totalPool / winningPool) : 1.5;
    }
    
    const winnings = Math.round(bet.amount * coefficient);
    return winnings > 0 ? winnings : 0;
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Baby className="w-16 h-16 mx-auto mb-4 text-babyPink animate-bounce" />
          <p className="text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  const userBets = state.bets.filter(b => b.userId === userId);
  const totalWinnings = state.genderRevealed && state.revealedGender && userBets.length > 0
    ? userBets.reduce((sum, bet) => {
        const winnings = getWinnings(bet, state.revealedGender!, state);
        return sum + winnings;
      }, 0)
    : 0;
  
  // Check if user has any winning bets
  const hasWinningBets = state.genderRevealed && state.revealedGender && userBets.length > 0
    ? userBets.some(bet => bet.gender === state.revealedGender)
    : false;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Baby className="w-12 h-12 text-babyPink baby-bounce" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Baby Gender Bets
            </h1>
            <Baby className="w-12 h-12 text-babyBlue baby-bounce" />
          </div>
          <p className="text-lg text-gray-600">
            🎀 Place your bets on the baby's gender! 👶
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {!userName.trim() ? (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Enter Your Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name..."
                  className="flex-1 px-4 py-2 border-2 border-babyPink rounded-lg focus:outline-none focus:ring-2 focus:ring-babyPink text-lg"
                  autoComplete="name"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-babyPink text-white rounded-lg font-semibold hover:bg-pink-300 transition"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xl font-bold text-gray-800">👋 Hello, {userName}!</p>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-gray-700">
                    Balance: {userBalance} ₸
                  </span>
                </div>
              </div>
              <button
                onClick={() => setUserName('')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Change Name
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center font-semibold ${
            message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Gender Reveal Status */}
        {state.genderRevealed && state.revealedGender && (
          <div className="bg-gradient-to-r from-babyPink to-babyBlue rounded-2xl shadow-lg p-8 mb-6 text-center">
            <div className="text-6xl mb-4">
              {state.revealedGender === 'boy' ? '👶' : '👶'}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              It's a {state.revealedGender === 'boy' ? 'BOY! 🎉' : 'GIRL! 🎀'}
            </h2>
            <p className="text-xl text-white mt-4 mb-4">
              {hasWinningBets && totalWinnings > 0 ? (
                <>Congratulations! You won {totalWinnings} ₸</>
              ) : userBets.length > 0 ? (
                <>Better luck next time!</>
              ) : (
                <>You didn't place any bets</>
              )}
            </p>
            
            {/* Winnings Breakdown */}
            {userBets.length > 0 && (
              <div className="mt-6 bg-white/20 rounded-lg p-4 text-left max-w-md mx-auto">
                <h3 className="font-bold text-white mb-2">Your Bets:</h3>
                <div className="space-y-2">
                  {userBets.map((bet, idx) => {
                    const won = bet.gender === state.revealedGender;
                    const winnings = won ? getWinnings(bet, state.revealedGender!, state) : 0;
                    return (
                      <div key={bet.id || idx} className="flex justify-between text-white text-sm">
                        <span>
                          {bet.amount} ₸ on {bet.gender.toUpperCase()}
                        </span>
                        <span className={won ? 'font-bold text-yellow-200' : 'text-gray-200'}>
                          {won ? `✓ Won ${winnings} ₸` : '✗ Lost'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {hasWinningBets && totalWinnings > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/30 flex justify-between font-bold text-white">
                    <span>Total Winnings:</span>
                    <span className="text-yellow-200">{totalWinnings} ₸</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Betting Interface */}
        {!state.genderRevealed && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Boy Option */}
            <div
              onClick={() => setSelectedGender('boy')}
              className={`bg-gradient-to-br from-babyBlue to-blue-200 rounded-2xl shadow-lg p-8 cursor-pointer transition transform ${
                selectedGender === 'boy' ? 'ring-4 ring-blue-500 scale-105' : 'hover:scale-102'
              }`}
            >
              <div className="text-center">
                <div className="text-7xl mb-4">👶</div>
                <h3 className="text-3xl font-bold text-blue-900 mb-2">BOY</h3>
                <div className="text-4xl font-bold text-blue-700 mb-4">
                  {state.boyCoefficient}x
                </div>
                <div className="text-lg text-blue-800">
                  Pool: {state.boyPool} ₸
                </div>
              </div>
            </div>

            {/* Girl Option */}
            <div
              onClick={() => setSelectedGender('girl')}
              className={`bg-gradient-to-br from-babyPink to-pink-200 rounded-2xl shadow-lg p-8 cursor-pointer transition transform ${
                selectedGender === 'girl' ? 'ring-4 ring-pink-500 scale-105' : 'hover:scale-102'
              }`}
            >
              <div className="text-center">
                <div className="text-7xl mb-4">👶</div>
                <h3 className="text-3xl font-bold text-pink-900 mb-2">GIRL</h3>
                <div className="text-4xl font-bold text-pink-700 mb-4">
                  {state.girlCoefficient}x
                </div>
                <div className="text-lg text-pink-800">
                  Pool: {state.girlPool} ₸
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bet Controls */}
        {!state.genderRevealed && selectedGender && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Bet Amount (₸)
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Math.min(userBalance, parseInt(e.target.value) || 0)))}
                min="1"
                max={userBalance}
                className="flex-1 px-4 py-2 border-2 border-babyPink rounded-lg focus:outline-none focus:ring-2 focus:ring-babyPink text-lg"
              />
              <div className="flex gap-2">
                {[100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setBetAmount(Math.min(amt, userBalance))}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={placeBet}
              disabled={loading || betAmount > userBalance || betAmount <= 0}
              className="w-full py-4 bg-gradient-to-r from-babyPink to-babyBlue text-white rounded-lg font-bold text-xl hover:from-pink-400 hover:to-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Placing Bet...' : `Place Bet (${betAmount} ₸)`}
            </button>
            <p className="text-center text-gray-600 mt-2">
              Potential winnings: {Math.round(betAmount * (selectedGender === 'boy' ? state.boyCoefficient : state.girlCoefficient))} ₸
            </p>
          </div>
        )}

        {/* Betting Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Betting Stats
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{state.totalPlayers}</p>
              <p className="text-gray-600">Players</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-2xl font-bold text-pink-700">{state.bets.length}</p>
              <p className="text-gray-600">Total Bets</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">
                {state.boyPool + state.girlPool} ₸
              </p>
              <p className="text-gray-600">Total Pool</p>
            </div>
          </div>
        </div>

        {/* Recent Bets */}
        {state.bets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Recent Bets
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...state.bets].reverse().slice(0, 10).map(bet => (
                <div
                  key={bet.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    bet.gender === 'boy' ? 'bg-blue-50' : 'bg-pink-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bet.gender === 'boy' ? '👶' : '👶'}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{bet.userName}</p>
                      <p className="text-sm text-gray-600">
                        Bet {bet.amount} ₸ on {bet.gender === 'boy' ? 'BOY' : 'GIRL'}
                      </p>
                    </div>
                  </div>
                  {state.genderRevealed && state.revealedGender && (
                    <div className="text-right">
                      <p className={`font-bold ${
                        bet.gender === state.revealedGender ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {bet.gender === state.revealedGender ? '✓ Won' : '✗ Lost'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>Virtual money only • For fun! 🎉</p>
        </div>
      </div>
    </div>
  );
}
