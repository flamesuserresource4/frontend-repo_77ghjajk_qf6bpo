import React, { useState } from 'react';
import Header from './components/Header';
import HUD from './components/HUD';
import PlantPalette from './components/PlantPalette';
import GameBoard from './components/GameBoard';

export default function App() {
  // Global game UI state
  const [sun, setSun] = useState(150);
  const [selected, setSelected] = useState(null);
  const [cooldowns, setCooldowns] = useState({ shooter: 0, wall: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-lime-50 text-gray-900">
      <Header />
      <main className="pb-12">
        <HUD sun={sun} selected={selected} onSelect={setSelected} cooldowns={cooldowns} />
        <PlantPalette sun={sun} selected={selected} onSelect={setSelected} cooldowns={cooldowns} />
        <GameBoard
          selected={selected}
          onSelect={setSelected}
          sun={sun}
          setSun={setSun}
          cooldowns={cooldowns}
          setCooldowns={setCooldowns}
        />
      </main>
      <footer className="py-6 text-center text-xs text-gray-500">
        Built as an original tribute-style garden defense. Not affiliated with any existing franchise.
      </footer>
    </div>
  );
}
