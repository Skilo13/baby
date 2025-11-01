'use client';

import { useState, useEffect } from 'react';
import { Baby, Lock, Unlock, Heart } from 'lucide-react';

export default function AdminPage() {
  const [revealed, setRevealed] = useState(false);
  const [revealedGender, setRevealedGender] = useState<'boy' | 'girl' | null>(null);
  const [selectedGender, setSelectedGender] = useState<'boy' | 'girl' | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    checkRevealStatus();
  }, []);

  const checkRevealStatus = async () => {
    try {
      const response = await fetch('/api/reveal');
      const data = await response.json();
      setRevealed(data.genderRevealed);
      setRevealedGender(data.revealedGender);
    } catch (error) {
      console.error('Failed to check reveal status:', error);
    }
  };

  const revealGender = async () => {
    if (!selectedGender) {
      setMessage('Please select a gender first!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const confirmReveal = confirm(
      `Are you sure you want to reveal the gender as ${selectedGender.toUpperCase()}? This action cannot be undone!`
    );

    if (!confirmReveal) return;

    setLoading(true);
    try {
      const response = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage backup so all clients can see the reveal
        const storedState = localStorage.getItem('betting_state_backup');
        let backupState = storedState ? JSON.parse(storedState) : null;
        
        if (backupState) {
          backupState = {
            ...backupState,
            genderRevealed: true,
            revealedGender: selectedGender,
          };
          localStorage.setItem('betting_state_backup', JSON.stringify(backupState));
        } else {
          // If no backup exists, create one with the revealed state
          localStorage.setItem('betting_state_backup', JSON.stringify(data));
        }
        
        setRevealed(true);
        setRevealedGender(selectedGender);
        setMessage('Gender revealed successfully! 🎉');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to reveal gender');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to reveal gender. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Lock className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Parent Portal
            </h1>
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-lg text-gray-600">
            Reveal the baby's gender to all bettors
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${
            message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Already Revealed */}
        {revealed && revealedGender && (
          <div className="bg-gradient-to-r from-babyPink to-babyBlue rounded-2xl shadow-lg p-8 mb-6 text-center">
            <div className="text-6xl mb-4">
              {revealedGender === 'boy' ? '👶' : '👶'}
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Unlock className="w-6 h-6 text-white" />
              <h2 className="text-3xl font-bold text-white">
                Gender Already Revealed!
              </h2>
            </div>
            <p className="text-3xl font-bold text-white">
              It's a {revealedGender.toUpperCase()}!
            </p>
            <p className="text-lg text-white mt-4 opacity-90">
              All bettors can now see the result
            </p>
          </div>
        )}

        {/* Reveal Interface */}
        {!revealed && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 mx-auto mb-4 text-red-400 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Ready to Reveal?
              </h2>
              <p className="text-gray-600">
                Select the baby's gender and reveal it to all bettors
              </p>
            </div>

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
                </div>
              </div>
            </div>

            {selectedGender && (
              <div className="text-center">
                <button
                  onClick={revealGender}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-xl hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Revealing...' : `Reveal as ${selectedGender.toUpperCase()}`}
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  ⚠️ This action cannot be undone
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Baby className="w-6 h-6 text-babyPink" />
            Instructions
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Only you (the parent) should have access to this page</li>
            <li>• The gender will remain hidden until you reveal it</li>
            <li>• Once revealed, all bettors will see the result</li>
            <li>• Make sure you're ready before clicking reveal!</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p>🔒 Secure Parent Portal</p>
        </div>
      </div>
    </div>
  );
}
