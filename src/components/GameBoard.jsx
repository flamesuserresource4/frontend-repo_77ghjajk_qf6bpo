import React, { useEffect, useMemo, useRef, useState } from 'react';

// Grid settings
const ROWS = 5;
const COLS = 9;
const CELL_W = 90; // px
const CELL_H = 90; // px

const COST = { shooter: 100, wall: 50 };
const COOLDOWN_MS = { shooter: 5000, wall: 4000 };

export default function GameBoard({ selected, onSelect, sun, setSun, cooldowns, setCooldowns }) {
  const boardRef = useRef(null);
  const [plants, setPlants] = useState({}); // key: `${r}-${c}` -> { type, hp, row, col, fireCooldown }
  const [pests, setPests] = useState([]); // { id, row, x, y, hp, speed }
  const [shots, setShots] = useState([]); // { id, row, x, y, speed, dmg }
  const [suns, setSuns] = useState([]); // { id, x, y, value }
  const [lost, setLost] = useState(false);
  const [wave, setWave] = useState(1);
  const pestId = useRef(1);
  const shotId = useRef(1);
  const sunId = useRef(1);

  // Sun trickle
  useEffect(() => {
    const t = setInterval(() => setSun((s) => s + 10), 4000);
    return () => clearInterval(t);
  }, [setSun]);

  // Random sun drops
  useEffect(() => {
    const t = setInterval(() => {
      const x = 100 + Math.random() * (COLS * CELL_W - 200);
      const y = 20 + Math.random() * (ROWS * CELL_H - 40);
      setSuns((arr) => [...arr, { id: sunId.current++, x, y, value: 25 }]);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Spawn waves of pests
  useEffect(() => {
    const spawn = () => {
      const row = Math.floor(Math.random() * ROWS);
      setPests((arr) => [
        ...arr,
        { id: pestId.current++, row, x: COLS * CELL_W - 20, y: row * CELL_H + CELL_H / 2 - 20, hp: 100 + wave * 20, speed: 0.3 + wave * 0.03 },
      ]);
    };

    const t = setInterval(spawn, Math.max(1200 - wave * 100, 500));
    const w = setInterval(() => setWave((w) => w + 1), 15000);
    return () => {
      clearInterval(t);
      clearInterval(w);
    };
  }, [wave]);

  // Game loop
  useEffect(() => {
    let raf;
    let last = performance.now();

    const loop = (now) => {
      const dt = now - last;
      last = now;

      // Update cooldown timers
      setCooldowns((cd) => {
        const next = { ...cd };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) next[k] = Math.max(0, next[k] - dt);
        });
        return next;
      });

      // Move pests
      setPests((arr) => {
        const next = [];
        let gameOver = false;
        for (const p of arr) {
          let x = p.x - p.speed * dt * 0.1;
          // Check collision with plants in same row
          const col = Math.floor(x / CELL_W);
          const targetKey = `${p.row}-${col}`;
          const plant = plants[targetKey];
          if (plant && plant.row === p.row) {
            // Attack plant
            plant.hp -= 0.04 * dt;
            if (plant.hp <= 0) {
              const { [targetKey]: _, ...rest } = plants;
              setPlants(rest);
            } else {
              x = p.x; // stop while chewing
            }
          }
          if (x < 0) {
            gameOver = true;
          } else {
            next.push({ ...p, x });
          }
        }
        if (gameOver) setLost(true);
        return next;
      });

      // Plants shooting
      setPlants((prev) => {
        const next = { ...prev };
        Object.values(next).forEach((pl) => {
          if (pl.type === 'shooter') {
            pl.fireCooldown -= dt;
            const anyPestAhead = pests.some((z) => z.row === pl.row && z.x > (pl.col + 0.5) * CELL_W);
            if (pl.fireCooldown <= 0 && anyPestAhead) {
              setShots((s) => [
                ...s,
                { id: shotId.current++, row: pl.row, x: (pl.col + 0.6) * CELL_W, y: pl.row * CELL_H + CELL_H / 2 - 6, speed: 0.6, dmg: 20 },
              ]);
              pl.fireCooldown = 900; // ms
            }
          }
        });
        return next;
      });

      // Move shots and apply damage
      setShots((arr) => {
        const next = [];
        for (const s of arr) {
          const x = s.x + s.speed * dt;
          // Hit check
          let hit = false;
          for (const p of pests) {
            if (p.row === s.row && Math.abs(p.x - x) < 15) {
              p.hp -= s.dmg;
              hit = true;
              break;
            }
          }
          if (!hit && x < COLS * CELL_W) next.push({ ...s, x });
        }
        // Cleanup dead pests
        setPests((zs) => zs.filter((z) => z.hp > 0));
        return next;
      });

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [plants, pests, setCooldowns]);

  const placePlant = (r, c) => {
    if (!selected) return;
    const key = `${r}-${c}`;
    if (selected === 'shovel') {
      setPlants((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      return;
    }
    if (plants[key]) return; // occupied
    const cost = COST[selected];
    if (sun < cost) return;
    // cooldown
    if ((cooldowns[selected] || 0) > 0) return;

    const plant = selected === 'shooter'
      ? { type: 'shooter', hp: 100, row: r, col: c, fireCooldown: 0 }
      : { type: 'wall', hp: 350, row: r, col: c };

    setPlants((prev) => ({ ...prev, [key]: plant }));
    setSun((s) => s - cost);
    setCooldowns((cd) => ({ ...cd, [selected]: COOLDOWN_MS[selected] }));
  };

  const collectSunAt = (mx, my) => {
    setSuns((arr) => {
      const idx = arr.findIndex((s) => Math.hypot(s.x - mx, s.y - my) < 20);
      if (idx !== -1) {
        const val = arr[idx].value;
        setSun((s) => s + val);
        return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
      }
      return arr;
    });
  };

  const handleBoardClick = (e) => {
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // check sun pickup first
    collectSunAt(x, y);

    const c = Math.floor(x / CELL_W);
    const r = Math.floor(y / CELL_H);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      placePlant(r, c);
    }
  };

  const gridCells = useMemo(() => {
    return Array.from({ length: ROWS * COLS }, (_, i) => ({
      r: Math.floor(i / COLS),
      c: i % COLS,
    }));
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto mt-6 px-4">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-green-300">
        <div
          ref={boardRef}
          onClick={handleBoardClick}
          className="relative"
          style={{ width: COLS * CELL_W, height: ROWS * CELL_H, backgroundImage: 'linear-gradient(90deg,#d6f4d0 50%,#c9efc3 50%), linear-gradient(#d6f4d0 50%,#c9efc3 50%)', backgroundSize: `${CELL_W}px ${CELL_H}px` }}
        >
          {/* Grid overlays */}
          {gridCells.map(({ r, c }) => (
            <div key={`${r}-${c}`} className="absolute inset-0 pointer-events-none" style={{ left: c * CELL_W, top: r * CELL_H, width: CELL_W, height: CELL_H }} />
          ))}

          {/* Plants */}
          {Object.entries(plants).map(([key, pl]) => (
            <div key={key} className="absolute flex items-center justify-center" style={{ left: pl.col * CELL_W + 10, top: pl.row * CELL_H + 10, width: CELL_W - 20, height: CELL_H - 20 }}>
              {pl.type === 'shooter' ? (
                <div className="w-full h-full rounded-full bg-emerald-500/90 border-4 border-emerald-700 shadow-inner relative">
                  <div className="absolute w-3 h-3 bg-yellow-200 rounded-full left-1/2 top-1/2 -translate-y-1/2 translate-x-3" />
                </div>
              ) : (
                <div className="w-full h-full rounded-lg bg-lime-600/90 border-4 border-lime-800 shadow-inner" />
              )}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-black/30 text-white px-1 rounded">
                {Math.max(0, Math.ceil(pl.hp))}hp
              </div>
            </div>
          ))}

          {/* Pests */}
          {pests.map((z) => (
            <div key={z.id} className="absolute" style={{ left: z.x, top: z.y, width: 40, height: 40 }}>
              <div className="w-10 h-10 rounded-lg bg-rose-500 border-4 border-rose-700 shadow relative animate-pulse" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] bg-black/30 text-white px-1 rounded">
                {Math.max(0, Math.ceil(z.hp))}hp
              </div>
            </div>
          ))}

          {/* Shots */}
          {shots.map((s) => (
            <div key={s.id} className="absolute" style={{ left: s.x, top: s.y }}>
              <div className="w-3 h-3 rounded-full bg-emerald-300 border border-emerald-700 shadow" />
            </div>
          ))}

          {/* Suns */}
          {suns.map((s) => (
            <div key={s.id} className="absolute cursor-pointer" style={{ left: s.x, top: s.y }}>
              <div className="w-8 h-8 rounded-full bg-yellow-300 border-2 border-amber-500 shadow-lg animate-bounce" />
            </div>
          ))}

          {/* Lost overlay */}
          {lost && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 text-center max-w-sm mx-auto">
                <h3 className="text-2xl font-extrabold text-rose-600">Garden Overrun!</h3>
                <p className="mt-2 text-sm text-gray-600">The pests reached your house. Try again and place defenses earlier.</p>
                <button
                  onClick={() => {
                    setPlants({});
                    setPests([]);
                    setShots([]);
                    setSuns([]);
                    setSun(150);
                    setLost(false);
                    setWave(1);
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">
        Tip: Collect suns, select a plant card, then click a tile to place. Use the shovel to remove.
      </p>
    </div>
  );
}
