import React from 'react';

export default function Header() {
  return (
    <header className="w-full py-4 px-6 bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500 text-white shadow-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow">
          Flora Fight Frenzy
        </h1>
        <p className="hidden sm:block text-sm text-white/90">
          A fast, original garden defense web game
        </p>
      </div>
    </header>
  );
}
