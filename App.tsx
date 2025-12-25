import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameMap } from './components/GameMap';
import { PuzzleModal } from './components/PuzzleModal';
import { GameState, TileData, BiomeType, Coordinates, GameLog, VisualEffect, VisualEffectType } from './types';
import { generateTileContent, generatePuzzle } from './services/geminiService';
import { INITIAL_LOG, XP_PER_PUZZLE, XP_PER_LEVEL } from './constants';
import { playSound, toggleMute } from './services/audioService';
import { Terminal, Database, Shield, Zap, Info, Box, Cpu, Save, Download, Volume2, VolumeX } from 'lucide-react';

const MAX_INVENTORY_SLOTS = 4;
const SAVE_KEY = 'infinite_cortex_save_v1';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 0, y: 0 },
      inventory: [],
      xp: 0,
      level: 1,
    },
    world: {},
    logs: [INITIAL_LOG],
    isGenerating: false,
    activePuzzle: null,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    const newLog: GameLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      message,
      type,
    };
    setGameState(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
  }, []);

  const triggerEffect = useCallback((x: number, y: number, type: VisualEffectType) => {
      const id = crypto.randomUUID();
      setVisualEffects(prev => [...prev, { id, x, y, type }]);
      
      // Cleanup effect after animation duration
      const duration = type === 'success' ? 1500 : type === 'move' ? 400 : 800;
      setTimeout(() => {
          setVisualEffects(prev => prev.filter(e => e.id !== id));
      }, duration);
  }, []);

  // --- Audio Control ---
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    toggleMute(newMuted);
  };

  // --- Save / Load Logic ---
  const saveGame = () => {
    playSound('click');
    try {
      const stateToSave = {
        ...gameState,
        isGenerating: false
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
      addLog('SYSTEM BACKUP COMPLETE. [STATE SAVED]', 'success');
    } catch (e) {
      console.error(e);
      addLog('BACKUP FAILED: WRITE ERROR.', 'error');
    }
  };

  const loadGame = () => {
    playSound('click');
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (!savedData) {
        addLog('NO BACKUP FOUND IN LOCAL STORAGE.', 'warning');
        return;
      }
      
      const parsedState = JSON.parse(savedData);
      if (!parsedState.player || !parsedState.world) {
        throw new Error("Invalid save file");
      }

      setGameState(parsedState);
      addLog('SYSTEM RESTORED FROM BACKUP. [STATE LOADED]', 'success');
    } catch (e) {
      console.error(e);
      addLog('RESTORE FAILED: CORRUPT DATA.', 'error');
    }
  };


  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  // --- World Generation Logic ---
  const ensureTileExists = useCallback(async (x: number, y: number) => {
    const id = `${x},${y}`;
    setGameState(prev => {
      if (prev.world[id]) return prev;

      // Determine biome randomly with refined distribution
      const rand = Math.random();
      let biome = BiomeType.DATA_WASTELAND;
      
      // Increased Reality Node chance to ~15%
      // More even distribution for others (~21-22%)
      if (rand < 0.15) biome = BiomeType.REALITY_NODE;
      else if (rand < 0.36) biome = BiomeType.QUANTUM_FLUX;
      else if (rand < 0.57) biome = BiomeType.SERVER_CITY;
      else if (rand < 0.78) biome = BiomeType.NEON_FOREST;
      else biome = BiomeType.DATA_WASTELAND;

      // Ensure Reality Nodes ALWAYS have a puzzle
      const hasPuzzle = biome === BiomeType.REALITY_NODE || Math.random() > 0.7;

      const newTile: TileData = {
        id,
        x,
        y,
        biome,
        description: 'Scanning...',
        explored: false,
        hasPuzzle,
        isSolved: false,
        visualFeature: '...'
      };

      return {
        ...prev,
        world: { ...prev.world, [id]: newTile }
      };
    });
  }, []);

  const enrichTileContent = useCallback(async (x: number, y: number) => {
    const id = `${x},${y}`;
    setGameState(prev => {
        const tile = prev.world[id];
        if (tile && tile.description !== 'Scanning...') return prev;
        return { ...prev, isGenerating: true };
    });

    let currentTile: TileData | undefined;
    setGameState(prev => {
        currentTile = prev.world[id];
        return prev;
    });

    if (!currentTile || currentTile.description !== 'Scanning...') {
         setGameState(prev => ({ ...prev, isGenerating: false }));
         return;
    }

    try {
        const content = await generateTileContent(x, y, currentTile.biome);
        setGameState(prev => ({
            ...prev,
            isGenerating: false,
            world: {
                ...prev.world,
                [id]: {
                    ...prev.world[id],
                    description: content.description,
                    visualFeature: content.visualFeature
                }
            }
        }));
        addLog(`Sector [${x},${y}]: ${content.description}`, 'info');
    } catch (e) {
        setGameState(prev => ({ ...prev, isGenerating: false }));
    }

  }, [addLog]);

  // --- Movement Logic ---
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState.activePuzzle) return; 

    playSound('move');
    
    setGameState(prev => {
      const newX = prev.player.position.x + dx;
      const newY = prev.player.position.y + dy;
      
      // Trigger move effect on new tile
      triggerEffect(newX, newY, 'move');

      return {
        ...prev,
        player: { ...prev.player, position: { x: newX, y: newY } }
      };
    });
  }, [gameState.activePuzzle, triggerEffect]);

  useEffect(() => {
    const { x, y } = gameState.player.position;
    const radius = 1; 
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        ensureTileExists(x + dx, y + dy);
      }
    }
    enrichTileContent(x, y);
  }, [gameState.player.position, ensureTileExists, enrichTileContent]);


  // --- Interaction Logic ---
  const handleTileClick = async (x: number, y: number) => {
    const tileId = `${x},${y}`;
    const tile = gameState.world[tileId];
    
    const dist = Math.abs(x - gameState.player.position.x) + Math.abs(y - gameState.player.position.y);
    
    if (dist > 1) {
        playSound('error');
        addLog("Target out of range.", 'warning');
        triggerEffect(x, y, 'error');
        return;
    }

    playSound('interface');
    triggerEffect(x, y, 'interact');

    if (tile.hasPuzzle && !tile.isSolved) {
        if (dist === 0) { 
            addLog("Interfacing with node logic...", 'info');
            setGameState(prev => ({...prev, isGenerating: true}));
            try {
                const puzzle = await generatePuzzle(tile.biome, gameState.player.level);
                setGameState(prev => ({
                    ...prev,
                    activePuzzle: puzzle,
                    isGenerating: false
                }));
            } catch(e) {
                 playSound('error');
                 addLog("Connection failed.", 'danger');
                 setGameState(prev => ({...prev, isGenerating: false}));
            }
        } else {
            playSound('error');
            triggerEffect(x, y, 'error');
            addLog("Move closer to interface.", 'warning');
        }
    } else {
        addLog(`Inspecting ${tile.visualFeature}: ${tile.description}`, 'info');
    }
  };

  const handlePuzzleSolve = (success: boolean) => {
      if (success && gameState.activePuzzle) {
          const { x, y } = gameState.player.position;
          const id = `${x},${y}`;

          // Trigger Visual Effect
          triggerEffect(x, y, 'success');

          const currentXp = gameState.player.xp;
          const currentLevel = gameState.player.level;
          const newXp = currentXp + XP_PER_PUZZLE;
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
          const isLevelUp = newLevel > currentLevel;
          
          setGameState(prev => ({
              ...prev,
              activePuzzle: null,
              player: {
                  ...prev.player,
                  xp: newXp,
                  level: newLevel
              },
              world: {
                  ...prev.world,
                  [id]: { ...prev.world[id], isSolved: true }
              }
          }));
          addLog(`Logic Gate Bypassed. Data extracted (+${XP_PER_PUZZLE} XP).`, 'success');

          if (isLevelUp) {
            playSound('levelUp');
            // Trigger visual effect on player pos for level up
            setTimeout(() => triggerEffect(x, y, 'level_up'), 500);

            setTimeout(() => {
                addLog(`*** SYSTEM UPGRADE *** LEVEL ${newLevel} REACHED. Processing power increased.`, 'success');
            }, 600);
          } else {
             // Success sound handled by PuzzleModal, but we can do extra here if needed
          }

      } else {
          setGameState(prev => ({ ...prev, activePuzzle: null }));
          addLog("Interface closed.", 'warning');
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
        case 'Enter': 
            handleTileClick(gameState.player.position.x, gameState.player.position.y);
            break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, gameState.player.position, gameState.world]); 

  const renderInventory = () => {
    const slots = [];
    for (let i = 0; i < MAX_INVENTORY_SLOTS; i++) {
        const item = gameState.player.inventory[i];
        slots.push(
            <div key={i} className="relative group">
                <div className={`w-12 h-12 border rounded bg-slate-900 flex items-center justify-center transition-colors ${item ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-slate-800'}`}>
                    {item ? (
                         <Box size={20} className="text-cyan-400" />
                    ) : (
                         <span className="text-slate-800 text-[10px] font-mono">{i + 1}</span>
                    )}
                </div>
                {item && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-cyan-500 text-cyan-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item}
                    </div>
                )}
            </div>
        );
    }
    return slots;
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col items-center justify-center p-4">
      
      {/* HUD Header */}
      <header className="w-full max-w-6xl flex flex-wrap justify-between items-end mb-6 border-b border-slate-800 pb-4">
        <div className="mb-2 md:mb-0">
           <h1 className="text-4xl font-bold font-mono text-white tracking-tighter flex items-center gap-3">
             <Cpu className="text-cyan-500" size={32} />
             INFINITE <span className="text-cyan-500">CORTEX</span>
           </h1>
           <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             SYSTEM ONLINE // v0.9.4 // CONNECTED
           </p>
        </div>

        <div className="flex gap-8 text-sm font-mono items-center">
            
            {/* System Controls */}
            <div className="flex gap-2 border-r border-slate-800 pr-6 items-center">
                <button 
                  onClick={handleToggleMute}
                  className="p-1.5 mr-2 text-slate-500 hover:text-cyan-400 transition-colors"
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <button 
                  onClick={saveGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 text-[10px] rounded transition-all uppercase tracking-wider group"
                  title="Save System State"
                >
                  <Save size={12} className="group-hover:scale-110 transition-transform" />
                  Save
                </button>
                <button 
                  onClick={loadGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500/50 text-slate-400 hover:text-yellow-400 text-[10px] rounded transition-all uppercase tracking-wider group"
                   title="Load System State"
                >
                  <Download size={12} className="group-hover:scale-110 transition-transform" />
                  Load
                </button>
            </div>

            {/* Stats Block */}
            <div className="flex gap-6 border-r border-slate-800 pr-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Coords</span>
                    <span className="text-cyan-400 font-bold">{gameState.player.position.x}, {gameState.player.position.y}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Level</span>
                    <span className="text-fuchsia-400 font-bold text-xl leading-none">{gameState.player.level}</span>
                </div>
            </div>

            {/* XP Block */}
            <div className="flex flex-col min-w-[140px]">
                <div className="flex justify-between w-full mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Experience</span>
                  <span className="text-xs text-yellow-400 font-mono">{gameState.player.xp} <span className="text-slate-600">/</span> {gameState.player.level * XP_PER_LEVEL}</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-sm overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400 transition-all duration-500 ease-out"
                      style={{ width: `${((gameState.player.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }}
                    />
                </div>
            </div>
        </div>
      </header>

      {/* Main Game Interface */}
      <main className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start">
        
        {/* Left Column: Map Scanner */}
        <div className="flex-shrink-0 flex flex-col gap-4">
           <div className="relative group p-1 border border-slate-700 rounded-lg bg-slate-900/50 backdrop-blur-sm shadow-2xl">
               {/* Decorative Scanner Elements */}
               <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-none"></div>
               <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-none"></div>
               <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-none"></div>
               <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-none"></div>
               
               <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-cyan-500/50 font-mono tracking-[0.2em] bg-black px-2 z-30">
                  REAL-TIME TOPOLOGY SCAN
               </div>

               <GameMap 
                 playerPosition={gameState.player.position} 
                 worldData={gameState.world} 
                 onTileClick={handleTileClick}
                 activeEffects={visualEffects}
               />
           </div>
           
           {/* Controls Hint */}
           <div className="text-center">
              <span className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-500 font-mono">
                  USE <strong className="text-slate-300">ARROWS</strong> TO NAVIGATE • <strong className="text-slate-300">ENTER</strong> TO INTERACT
              </span>
           </div>
        </div>

        {/* Right Column: HUD Panels */}
        <div className="flex-grow flex flex-col gap-4 w-full h-[600px]">
            
            {/* Top Row: Inventory & Status */}
            <div className="flex gap-4 h-1/4">
                {/* Inventory Panel */}
                <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg flex flex-col w-1/2">
                    <div className="flex items-center justify-between text-slate-500 mb-2 uppercase tracking-widest text-[10px] font-bold border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-2"><Box size={12} /> Storage</span>
                        <span className="text-cyan-900">{gameState.player.inventory.length}/{MAX_INVENTORY_SLOTS}</span>
                    </div>
                    <div className="flex-grow flex items-center gap-2 justify-center">
                        {renderInventory()}
                    </div>
                </div>

                {/* Status/Buffs Panel (Placeholder for now) */}
                <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg flex flex-col w-1/2">
                     <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-widest text-[10px] font-bold border-b border-slate-800 pb-1">
                        <Zap size={12} /> System Integrity
                    </div>
                    <div className="flex-grow flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-2 text-xs text-green-400">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                             Network Stable
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                             <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                             Firewall Active
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Current Tile Info Panel */}
            <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg h-1/3 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                    <Database size={120} />
                </div>
                <div className="flex items-center gap-2 text-cyan-500 mb-2 uppercase tracking-widest text-sm font-bold border-b border-slate-800 pb-1 z-10">
                    <Info size={16} /> Sector Analysis
                </div>
                {gameState.isGenerating ? (
                    <div className="flex-grow flex items-center justify-center text-cyan-500/50 animate-pulse font-mono z-10">
                        > DECRYPTING_SECTOR_DATA...
                    </div>
                ) : (
                   <div className="flex-grow z-10">
                        {(() => {
                            const id = `${gameState.player.position.x},${gameState.player.position.y}`;
                            const tile = gameState.world[id];
                            if(!tile) return <span className="text-slate-600">No Data</span>;
                            return (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded border font-mono ${
                                            tile.biome === BiomeType.REALITY_NODE ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-600 text-slate-400'
                                        }`}>
                                            {tile.biome.replace('_', ' ')}
                                        </span>
                                        {tile.hasPuzzle && !tile.isSolved && <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-1 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-700/50"><Shield size={10}/> ENCRYPTED</span>}
                                        {tile.isSolved && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 bg-green-900/20 px-2 py-0.5 rounded border border-green-700/50"><Zap size={10}/> UNLOCKED</span>}
                                    </div>
                                    <p className="text-slate-300 leading-relaxed font-light text-sm">
                                        "{tile.description}"
                                    </p>
                                    <p className="mt-4 text-[10px] text-slate-500 font-mono uppercase">
                                        VISUAL_TAG: {tile.visualFeature}
                                    </p>
                                </>
                            );
                        })()}
                   </div>
                )}
            </div>

            {/* System Logs */}
            <div className="bg-black border border-slate-800 rounded-lg h-2/5 p-4 font-mono text-sm overflow-y-auto flex flex-col shadow-inner">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-widest text-[10px] font-bold sticky top-0 bg-black pb-2 border-b border-slate-900">
                    <Terminal size={12} /> Event_Log
                </div>
                <div className="flex-grow space-y-1.5">
                    {gameState.logs.map(log => (
                        <div key={log.id} className="flex gap-2 text-xs font-mono animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-slate-700 select-none">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                            <span className={`${
                                log.type === 'error' ? 'text-red-500' :
                                log.type === 'warning' ? 'text-yellow-500' :
                                log.type === 'success' ? 'text-green-400' :
                                'text-cyan-200'
                            }`}>
                                {log.type === 'info' && '> '}
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      {gameState.activePuzzle && (
          <PuzzleModal 
            puzzle={gameState.activePuzzle} 
            onSolve={handlePuzzleSolve} 
            onClose={() => {
                playSound('click');
                setGameState(prev => ({...prev, activePuzzle: null}));
            }}
          />
      )}
    </div>
  );
};

export default App;