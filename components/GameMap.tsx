import React, { useMemo } from 'react';
import { Coordinates, TileData, BiomeType, VisualEffect, VisualEffectType } from '../types';
import { TILE_SIZE, VIEWPORT_RADIUS, BIOME_COLORS, BIOME_ICONS } from '../constants';
import { MapPin, HelpCircle, CheckCircle, Zap, Map as MapIcon, XOctagon } from 'lucide-react';

interface GameMapProps {
  playerPosition: Coordinates;
  worldData: Record<string, TileData>;
  onTileClick: (x: number, y: number) => void;
  activeEffects?: VisualEffect[];
}

export const GameMap: React.FC<GameMapProps> = ({ playerPosition, worldData, onTileClick, activeEffects }) => {
  
  // Calculate visible grid
  const visibleTiles = useMemo(() => {
    const tiles = [];
    for (let dy = -VIEWPORT_RADIUS; dy <= VIEWPORT_RADIUS; dy++) {
      for (let dx = -VIEWPORT_RADIUS; dx <= VIEWPORT_RADIUS; dx++) {
        const x = playerPosition.x + dx;
        const y = playerPosition.y + dy;
        const id = `${x},${y}`;
        const existingTile = worldData[id];
        tiles.push({ x, y, data: existingTile });
      }
    }
    return tiles;
  }, [playerPosition, worldData]);

  const readableBiomeNames: Record<BiomeType, string> = {
    [BiomeType.DATA_WASTELAND]: 'Data Wasteland',
    [BiomeType.NEON_FOREST]: 'Neon Forest',
    [BiomeType.SERVER_CITY]: 'Server City',
    [BiomeType.QUANTUM_FLUX]: 'Quantum Flux',
    [BiomeType.REALITY_NODE]: 'Reality Node',
  };

  const renderVisualEffect = (effect: VisualEffect) => {
      switch(effect.type) {
          case 'success':
              return (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                    {/* Shockwave */}
                    <div className="absolute inset-0 border-2 border-green-400 rounded-full" 
                         style={{animation: 'shockwave 0.8s ease-out forwards'}} />
                    <div className="absolute inset-0 border-2 border-white rounded-full" 
                         style={{animation: 'shockwave 0.8s ease-out 0.2s forwards'}} />
                    {/* Particles */}
                    {[...Array(12)].map((_, i) => (
                         <div 
                            key={i}
                            className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full shadow-[0_0_8px_rgba(250,204,21,1)]"
                            style={{
                                '--angle': `${i * 30}deg`,
                                animation: 'particle-explode 0.8s ease-out forwards'
                            } as React.CSSProperties}
                         />
                    ))}
                     <div className="absolute w-full h-full bg-white/50 rounded-full animate-ping opacity-50" />
                </div>
              );
          case 'interact':
              return (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                       <div className="absolute w-full h-full border border-cyan-400 rounded-lg animate-ping opacity-50" />
                       <div className="absolute w-2 h-2 bg-cyan-200 rounded-full animate-ping" />
                  </div>
              );
          case 'error':
              return (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-red-500/20">
                      <XOctagon size={24} className="text-red-500 animate-bounce" />
                  </div>
              );
          case 'level_up':
              return (
                <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                     <div className="absolute inset-0 border-4 border-yellow-400 rounded-full" 
                         style={{animation: 'shockwave 1.5s ease-out forwards'}} />
                     {[...Array(8)].map((_, i) => (
                         <div 
                            key={i}
                            className="absolute text-yellow-300 font-bold text-xs"
                             style={{
                                transform: `rotate(${i * 45}deg) translateY(-20px)`,
                                animation: 'float-up 1s ease-out forwards'
                            }}
                         >▲</div>
                    ))}
                </div>
              );
          case 'move':
              return (
                  <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                      <div className="absolute inset-0 border border-cyan-500/30 rounded-full" 
                           style={{animation: 'ripple-expand 0.4s ease-out forwards'}} />
                  </div>
              );
          default: return null;
      }
  };

  const renderBiomeAtmosphere = (biome: BiomeType) => {
      switch(biome) {
          case BiomeType.NEON_FOREST:
              return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                      {/* Fog Layer */}
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/0 via-emerald-500/10 to-emerald-900/0"
                           style={{backgroundSize: '200% 100%', animation: 'fog-flow 8s linear infinite'}} />
                      
                      {/* Floating Spores */}
                      {[...Array(3)].map((_, i) => (
                          <div key={i} className="absolute w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]"
                               style={{
                                   left: `${Math.random() * 100}%`,
                                   top: '80%',
                                   animation: `float-up ${2 + Math.random()}s infinite ease-in-out ${Math.random()}s`
                               }} />
                      ))}
                  </div>
              );
          case BiomeType.DATA_WASTELAND:
               return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                       {/* Static Noise */}
                       <div className="absolute inset-0 bg-white mix-blend-overlay" 
                            style={{animation: 'static-flicker 2s infinite steps(4)'}} />
                       {/* Glitch Overlay */}
                       <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.5)_25%,rgba(0,0,0,0.5)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.5)_75%,rgba(0,0,0,0.5)_100%)] bg-[length:4px_4px]" 
                            style={{animation: 'glitch-skew 3s infinite steps(5)'}} />
                  </div>
               );
          case BiomeType.SERVER_CITY:
              return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                       <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.1)_1px,transparent_1px)] bg-[size:8px_8px]" />
                       <div className="absolute top-0 left-1/4 w-px h-full bg-indigo-500/60 shadow-[0_0_4px_rgba(99,102,241,1)]" style={{animation: 'matrix-fall 2s infinite linear'}} />
                       <div className="absolute top-0 left-3/4 w-px h-full bg-indigo-500/60 shadow-[0_0_4px_rgba(99,102,241,1)]" style={{animation: 'matrix-fall 3s infinite linear 1s'}} />
                  </div>
              );
          case BiomeType.QUANTUM_FLUX:
              return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 border-2 border-fuchsia-500/30 rounded-full" 
                           style={{animation: 'rift-spin 6s linear infinite'}} />
                      <div className="absolute inset-2 border border-fuchsia-400/20 rounded-full"
                           style={{animation: 'rift-spin 4s linear infinite reverse'}} />
                  </div>
              );
          case BiomeType.REALITY_NODE:
              return (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
                    <div className="absolute -inset-4 bg-amber-400/5 blur-xl animate-pulse" />
                    <div className="absolute inset-1 border border-amber-500/40 rounded-full" style={{animation: 'rift-spin 12s linear infinite'}} />
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="relative overflow-hidden bg-black border-4 border-slate-800 rounded-lg shadow-2xl"
        style={{
          width: (VIEWPORT_RADIUS * 2 + 1) * TILE_SIZE,
          height: (VIEWPORT_RADIUS * 2 + 1) * TILE_SIZE,
        }}
      >
        {/* Grid Rendering */}
        {visibleTiles.map(({ x, y, data }) => {
          // Calculate relative position for rendering
          const relX = (x - playerPosition.x + VIEWPORT_RADIUS) * TILE_SIZE;
          const relY = (y - playerPosition.y + VIEWPORT_RADIUS) * TILE_SIZE;

          if (!data) {
            // Unexplored/Loading area
            return (
              <div
                key={`${x},${y}`}
                className="absolute bg-gray-900 border border-gray-800 animate-pulse"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  left: relX,
                  top: relY,
                }}
              />
            );
          }

          const isPlayer = x === playerPosition.x && y === playerPosition.y;
          const baseClasses = BIOME_COLORS[data.biome] || 'bg-gray-800';
          const effects = activeEffects?.filter(e => e.x === x && e.y === y);
          
          return (
            <div
              key={data.id}
              onClick={() => onTileClick(x, y)}
              className={`absolute flex items-center justify-center border transition-all duration-300 cursor-pointer hover:brightness-110 overflow-hidden ${baseClasses}`}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: relX,
                top: relY,
              }}
            >
              {/* Biome Atmosphere Layer */}
              {renderBiomeAtmosphere(data.biome)}

              {/* Tile Icon */}
              <div className={`text-xl opacity-70 select-none z-10 ${data.biome === BiomeType.DATA_WASTELAND ? 'animate-[glitch-skew_4s_infinite]' : ''}`}>
                {BIOME_ICONS[data.biome]}
              </div>

              {/* Puzzle Indicator */}
              {data.hasPuzzle && !data.isSolved && (
                <div className="absolute top-1 right-1 z-20">
                   <HelpCircle size={14} className="text-yellow-400 animate-bounce drop-shadow-[0_0_2px_rgba(250,204,21,0.8)]" />
                </div>
              )}

              {/* Solved Indicator */}
              {data.isSolved && (
                 <div className="absolute bottom-1 right-1 z-20">
                   <CheckCircle size={12} className="text-green-400" />
                 </div>
              )}

              {/* Player Avatar Overlay */}
              {isPlayer && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="relative">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] border-2 border-white flex items-center justify-center">
                      <MapPin size={16} className="text-black" />
                    </div>
                    {/* New Pulse Ring Animation */}
                    <div className="absolute -inset-4 rounded-full" style={{animation: 'pulse-ring 2s infinite'}} />
                  </div>
                </div>
              )}
              
              {/* Transient Visual Effects Overlay */}
              {effects && effects.map(effect => (
                  <React.Fragment key={effect.id}>
                      {renderVisualEffect(effect)}
                  </React.Fragment>
              ))}

              {/* Coordinate Label (Debug/Aesthetic) */}
              <span className="absolute bottom-0.5 left-1 text-[8px] text-white/30 font-mono z-20">
                {x},{y}
              </span>
            </div>
          );
        })}
        
        {/* Scanline Overlay */}
        <div className="absolute inset-0 scanline pointer-events-none z-50 opacity-30"></div>
      </div>

      {/* Legend */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MapIcon size={12} /> Terrain Key
        </h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            {Object.values(BiomeType).map((biome) => (
                <div key={biome} className="flex items-center gap-2">
                    <span className="text-lg leading-none w-5 text-center">{BIOME_ICONS[biome]}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                        {readableBiomeNames[biome]}
                    </span>
                </div>
            ))}
            <div className="col-span-2 h-px bg-slate-800 my-1"></div>
            <div className="flex items-center gap-2">
                <div className="w-5 flex justify-center"><HelpCircle size={14} className="text-yellow-400" /></div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Node</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 flex justify-center"><CheckCircle size={14} className="text-green-400" /></div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Secured Node</span>
            </div>
             <div className="flex items-center gap-2">
                <div className="w-5 flex justify-center">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full border border-white"></div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">You</span>
            </div>
        </div>
      </div>
    </div>
  );
};