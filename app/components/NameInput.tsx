'use client';

import { useState, useRef, useEffect, memo } from 'react';

interface NameInputProps {
  onSave: (name: string) => void;
  initialName?: string;
}

function NameInput({ onSave, initialName = '' }: NameInputProps) {
  const [localName, setLocalName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Only set initial value once, never update from props after mount
  useEffect(() => {
    if (!hasInitialized.current && initialName) {
      setLocalName(initialName);
      hasInitialized.current = true;
    }
  }, [initialName]);

  useEffect(() => {
    // Focus the input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Ensure cursor is at the end if there's text
        if (inputRef.current.value) {
          inputRef.current.setSelectionRange(
            inputRef.current.value.length,
            inputRef.current.value.length
          );
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalName(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmedName = localName.trim();
    if (trimmedName) {
      onSave(trimmedName);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <label className="block text-lg font-semibold text-gray-700 mb-2">
        Enter Your Name
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          key="name-input" // Stable key to prevent remounting
          type="text"
          value={localName}
          onChange={handleChange}
          onInput={handleChange}
          placeholder="Your name..."
          className="flex-1 px-4 py-2 border-2 border-babyPink rounded-lg focus:outline-none focus:ring-2 focus:ring-babyPink text-lg"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-testid="name-input"
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
  );
}

// Memoize to prevent re-renders when parent updates
export default memo(NameInput);

