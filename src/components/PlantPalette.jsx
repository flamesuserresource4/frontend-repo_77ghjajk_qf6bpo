import React from 'react';
import { Leaf, Shield, Trash2 } from 'lucide-react';

const PLANTS = [
  { id: 'shooter', name: 'Shooter', cost: 100, icon: Leaf, color: 'bg-emerald-200 border-emerald-400' },
  { id: 'wall', name: 'Wall', cost: 50, icon: Shield, color: 'bg-lime-200 border-lime-400' },
  { id: 'shovel', name: 'Shovel', cost: 0, icon: Trash2, color: 'bg-rose-200 border-rose-400' },
];

export default function PlantPalette({ sun, selected, onSelect, cooldowns }) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-4 px-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {PLANTS.map((p) => {
          const Icon = p.icon;
          const disabled = p.id !== 'shovel' && sun < p.cost;
          const isSelected = selected === p.id;
          const cd = cooldowns[p.id] || 0;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              disabled={disabled || cd > 0}
              className={`relative flex flex-col items-center justify-center gap-1 border rounded-xl p-3 transition-all shadow-sm ${p.color} ${
                disabled || cd > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
              } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <Icon className="w-6 h-6 text-gray-800" />
              <span className="text-xs font-semibold text-gray-800">{p.name}</span>
              <span className="text-[10px] text-gray-700 font-medium">{p.cost} ☀︎</span>
              {cd > 0 && (
                <span className="absolute top-1 right-1 text-[10px] bg-white/80 px-1 rounded text-rose-600 font-bold">
                  {Math.ceil(cd / 1000)}s
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
