import React from 'react';
import { Sun, Leaf, Shield, Trash2 } from 'lucide-react';

export default function HUD({ sun, selected, onSelect, cooldowns }) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-4 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg shadow">
          <Sun className="w-4 h-4" />
          <span className="font-semibold">Sun:</span>
          <span className="text-lg font-bold">{sun}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Selected:</span>
          <span className="px-2 py-1 rounded-md bg-gray-100 font-medium">
            {selected || 'None'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Cooldowns</span>
          <div className="flex gap-2">
            <Badge icon={<Leaf className="w-3 h-3" />} label="Shooter" value={cooldowns.shooter} />
            <Badge icon={<Shield className="w-3 h-3" />} label="Wall" value={cooldowns.wall} />
            <Badge icon={<Trash2 className="w-3 h-3" />} label="Shovel" value={0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, value }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm">
      <span className="text-gray-700 flex items-center gap-1">{icon}{label}</span>
      {value > 0 ? (
        <span className="text-[10px] font-bold text-rose-600">{Math.ceil(value / 1000)}s</span>
      ) : (
        <span className="text-[10px] font-semibold text-emerald-600">Ready</span>
      )}
    </div>
  );
}
