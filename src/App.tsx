/**
 * Geometric Overload - 几何超载
 * Web-based zero-asset roguelite geometric survivor game.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { sound } from './game/infra/audio';
import { Player, UpgradeOption, GameStats, CharacterId, GameMode, EnemyType } from './game/core/types';
import { getRandomUpgrades } from './game/cards/upgrades';
import { poolForMode } from './game/cards/upgradePools';
import { modeForPilots, modeOfPlayer } from './game/core/modes';
import { VirtualJoystick } from './game/infra/joystick';
import { HUD } from './components/HUD';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { StartScreen } from './components/StartScreen';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { CodexModal } from './components/CodexModal';
import { SandboxPanel } from './components/SandboxPanel';
import { DebugTracePanel } from './components/DebugTracePanel';
import { DebugEvent } from './game/engine/debugTrace';
import { flushTrace } from './game/infra/traceSink';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const joystickRef = useRef<VirtualJoystick | null>(null);

  const [gameState, setGameState] = useState<
    'title' | 'character_select' | 'playing' | 'paused' | 'levelup' | 'gameover'
  >('title');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('alpha_prism');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [twinPilotId, setTwinPilotId] = useState<CharacterId | null>(null);
  const [playerState, setPlayerState] = useState<Player | null>(null);
  const [gameTime, setGameTime] = useState<number>(0);
  const [bossWarning, setBossWarning] = useState<boolean>(false);
  const [currentUpgrades, setCurrentUpgrades] = useState<UpgradeOption[]>([]);
  const [upgradeLevels, setUpgradeLevels] = useState<Record<string, number>>({});
  const upgradeLevelsRef = useRef<Record<string, number>>({});
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [codexInitialKey, setCodexInitialKey] = useState<string | undefined>(undefined);
  const [endStats, setEndStats] = useState<GameStats | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('geom_overload_hs') || 0);
    } catch {
      return 0;
    }
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  /** Test switch, kept with the other settings and persisted so a reload keeps it. */
  const [infiniteReroll, setInfiniteReroll] = useState<boolean>(() => {
    try {
      return localStorage.getItem('geom_overload_infinite_reroll') === '1';
    } catch {
      return false;
    }
  });
  const [timeScale, setTimeScale] = useState<number>(1);
  const [controlMode, setControlMode] = useState<'keys' | 'mouse'>('keys');
  /** Sandbox only; reset with every new run so it can never leak into a real one. */
  const [devInvincible, setDevInvincible] = useState<boolean>(false);
  /** Test switch: which card table the sandbox draws from. */
  const [sandboxPool, setSandboxPool] = useState<'standard' | 'overflow'>('standard');
  const sandboxPoolRef = useRef<'standard' | 'overflow'>('standard');
  /** Test switch: record player-round hits and spawn-shot decisions. */
  const [debugTrace, setDebugTrace] = useState<boolean>(() => {
    try {
      return localStorage.getItem('geom_overload_debug_trace') === '1';
    } catch {
      return false;
    }
  });
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);

  // Initialize Canvas & Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onLevelUp: () => {
        if (!engineRef.current) return;
        const p = engineRef.current.player;
        const currentLevels = p.upgradeLevels || upgradeLevelsRef.current;
        const pool = poolForMode(
          modeOfPlayer(p),
          p.gameMode === 'sandbox' ? sandboxPoolRef.current : undefined
        );
        const options = getRandomUpgrades(p, currentLevels, 3, pool);
        setCurrentUpgrades(options);
        setGameState('levelup');
      },
      onGameOver: (stats) => {
        const fullStats: GameStats = {
          ...stats,
          upgradesTaken: Object.keys(upgradeLevelsRef.current),
        };
        setEndStats(fullStats);
        setGameState('gameover');

        if (stats.score > highScore) {
          setHighScore(stats.score);
          try {
            localStorage.setItem('geom_overload_hs', stats.score.toString());
          } catch {
            // Ignore
          }
        }
      },
      onStatsUpdate: (p, time, warning) => {
        setPlayerState({ ...p });
        setGameTime(time);
        setBossWarning(warning);
      },
    });

    engineRef.current = engine;
    setPlayerState(engine.player);

    // Initialize Virtual Joystick
    if (joystickContainerRef.current && joystickKnobRef.current) {
      const joystick = new VirtualJoystick(
        joystickContainerRef.current,
        joystickKnobRef.current
      );
      joystickRef.current = joystick;

      const interval = setInterval(() => {
        if (engineRef.current && joystickRef.current) {
          engineRef.current.joystickVector = joystickRef.current.vector;
        }
      }, 16);

      return () => {
        clearInterval(interval);
        joystick.destroy();
        engine.destroy();
      };
    }

    return () => {
      engine.destroy();
    };
  }, []);

  // Push the trace switch into the live engine and poll its ring buffer while
  // it is on; the engine writes at bullet-hit rate, React only needs a glance.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (debugTrace) {
      engine.setDebugTrace(true);
      engine.recordDebugEvent(
        'session',
        `char=${engine.player.characterId} mode=${engine.player.gameMode} spawnShot=${engine.player.spawnShotCount}`
      );
      flushTrace(engine.debugEvents);
    } else {
      flushTrace(engine.debugEvents);
      engine.setDebugTrace(false);
      setDebugEvents([]);
    }
  }, [debugTrace]);

  useEffect(() => {
    if (!debugTrace || gameState !== 'playing') return;
    const id = setInterval(() => {
      const engine = engineRef.current;
      if (engine) {
        setDebugEvents(engine.debugEvents.slice(-10));
        flushTrace(engine.debugEvents);
      }
    }, 400);
    return () => clearInterval(id);
  }, [debugTrace, gameState]);

  const pauseGame = useCallback(() => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.pauseGame();
      setGameState('paused');
    }
  }, [gameState]);

  const resumeGame = useCallback(() => {
    if (engineRef.current && gameState === 'paused') {
      engineRef.current.resumeGame();
      setGameState('playing');
    }
  }, [gameState]);

  const handleOpenCodex = useCallback((initialKey?: string) => {
    if (gameState === 'playing' && engineRef.current) {
      engineRef.current.pauseGame();
      setGameState('paused');
    }
    setCodexInitialKey(initialKey);
    setIsCodexOpen(true);
  }, [gameState]);

  const handleCloseCodex = useCallback(() => {
    setIsCodexOpen(false);
  }, []);

  // Global Keyboard Shortcuts (Pause & Codex C hotkey)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        if (isCodexOpen) {
          setIsCodexOpen(false);
        } else {
          handleOpenCodex();
        }
        return;
      }
      if (isCodexOpen && e.key === 'Escape') {
        setIsCodexOpen(false);
        return;
      }
      if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && gameState === 'playing') {
        pauseGame();
      } else if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && gameState === 'paused') {
        resumeGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isCodexOpen, handleOpenCodex, pauseGame, resumeGame]);

  const startGameWithChar = useCallback(
    (charId: CharacterId, twinId?: CharacterId) => {
      // The mode picked on the title screen decides the run; the second pilot
      // only says which two-pilot mode this is.
      const mode: GameMode = modeForPilots(gameMode, twinId);
      const carrierPilots = [charId, twinId].filter((c) => c === 'epsilon_carrier').length;
      const initialUpgrades: Record<string, number> =
        carrierPilots > 0 ? { summon_drone: carrierPilots } : {};

      setSelectedCharacterId(charId);
      setGameMode(mode);
      setTwinPilotId(twinId || null);
      setDevInvincible(false);
      upgradeLevelsRef.current = initialUpgrades;
      setUpgradeLevels(initialUpgrades);
      setEndStats(null);
      setGameState('playing');
      if (engineRef.current) {
        engineRef.current.startNewGame(charId, mode, twinId);
        engineRef.current.player.upgradeLevels = { ...initialUpgrades };
        if (carrierPilots > 0) {
          engineRef.current.player.activeSlots = ['summon_drone'];
        }
        setPlayerState(engineRef.current.player);
      }
    },
    [gameMode]
  );

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const toggleInfiniteReroll = useCallback(() => {
    setInfiniteReroll((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('geom_overload_infinite_reroll', next ? '1' : '0');
      } catch {
        // Ignore
      }
      return next;
    });
    sound.playClick(true);
  }, []);

  const handleChangeTimeScale = useCallback((scale: number) => {
    setTimeScale(scale);
    if (engineRef.current) {
      engineRef.current.timeScale = scale;
    }
  }, []);

  const handleToggleControlMode = useCallback(() => {
    const next = controlMode === 'mouse' ? 'keys' : 'mouse';
    setControlMode(next);
    if (engineRef.current) {
      engineRef.current.setControlMode(next);
    }
  }, [controlMode]);

  const handleTriggerSkill = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerActiveSkill();
    }
  }, []);

  const handleSpawnTestEnemies = useCallback((type: EnemyType, count: number) => {
    engineRef.current?.spawnTestEnemies(type, count);
  }, []);

  const handleClearTestField = useCallback(() => {
    engineRef.current?.clearTestField();
  }, []);

  const handleToggleDevInvincible = useCallback(() => {
    setDevInvincible((prev) => {
      const next = !prev;
      engineRef.current?.setDevInvincible(next);
      return next;
    });
  }, []);

  const handleChangeSandboxPool = useCallback((pool: 'standard' | 'overflow') => {
    sandboxPoolRef.current = pool;
    setSandboxPool(pool);
  }, []);

  const handleToggleDebugTrace = useCallback(() => {
    setDebugTrace((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('geom_overload_debug_trace', next ? '1' : '0');
      } catch {
        // Ignore
      }
      sound.playClick(true);
      return next;
    });
  }, []);

  const handleReroll = useCallback(() => {
    if (!engineRef.current) return;
    const p = engineRef.current.player;
    // The infinite-reroll test switch rerolls without spending the run's count.
    if (!infiniteReroll && (p.rerollCount || 0) <= 0) return;
    if (!infiniteReroll) p.rerollCount--;

    const currentLevels = p.upgradeLevels || upgradeLevelsRef.current;
    const pool = poolForMode(
      modeOfPlayer(p),
      p.gameMode === 'sandbox' ? sandboxPoolRef.current : undefined
    );
    const options = getRandomUpgrades(p, currentLevels, 3, pool);
    setCurrentUpgrades(options);
    setPlayerState({ ...p });
  }, [infiniteReroll]);

  const handleSelectUpgrade = useCallback(
    (upgrade: UpgradeOption) => {
      if (!engineRef.current) return;
      const p = engineRef.current.player;

      if (!p.activeSlots) p.activeSlots = [];
      if (!p.activeSlots.includes(upgrade.key)) {
        p.activeSlots.push(upgrade.key);
      }

      if (!p.upgradeLevels) p.upgradeLevels = {};
      // The level being granted is computed before apply() so multi-level
      // upgrades can scale; without it every level past the first was a no-op.
      const nextLevel = (p.upgradeLevels[upgrade.key] || 0) + 1;

      upgrade.apply(p, nextLevel);

      p.upgradeLevels[upgrade.key] = nextLevel;
      engineRef.current.recordDebugEvent('card', `${upgrade.key} Lv.${nextLevel}`);
      upgradeLevelsRef.current = { ...p.upgradeLevels };

      setUpgradeLevels({ ...p.upgradeLevels });

      engineRef.current.resumeGame();
      setGameState('playing');
    },
    []
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070d] select-none touch-none">
      {/* HTML5 Game Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair z-0"
      />

      {/* Virtual Joystick Visual Component (Hidden until touch) */}
      <div
        ref={joystickContainerRef}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-cyan-400/40 bg-cyan-950/20 backdrop-blur-sm z-30 transition-opacity duration-150 opacity-0 flex items-center justify-center"
      >
        <div
          ref={joystickKnobRef}
          className="w-12 h-12 rounded-full bg-cyan-400/70 border border-white shadow-[0_0_12px_rgba(0,255,204,0.6)]"
        />
      </div>

      {/* In-Game HUD */}
      {playerState && (gameState === 'playing' || gameState === 'paused' || gameState === 'levelup') && (
        <HUD
          player={playerState}
          timeSeconds={gameTime}
          bossWarning={bossWarning}
          isMuted={isMuted}
          timeScale={timeScale}
          controlMode={controlMode}
          onToggleMute={toggleMute}
          onPause={pauseGame}
          onTriggerSkill={handleTriggerSkill}
          onChangeTimeScale={handleChangeTimeScale}
          onToggleControlMode={handleToggleControlMode}
        />
      )}

      {/* Sandbox-only manual spawner */}
      {gameState === 'playing' && gameMode === 'sandbox' && playerState && (
        <SandboxPanel
          invincible={devInvincible}
          cardPool={sandboxPool}
          onChangeCardPool={handleChangeSandboxPool}
          onSpawn={handleSpawnTestEnemies}
          onClear={handleClearTestField}
          onToggleInvincible={handleToggleDevInvincible}
        />
      )}

      {debugTrace && gameState === 'playing' && <DebugTracePanel events={debugEvents} />}

      {/* Start Title Screen */}
      {gameState === 'title' && (
        <StartScreen
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onStart={(mode) => {
            setGameMode(mode);
            setGameState('character_select');
          }}
          onOpenCodex={() => handleOpenCodex()}
        />
      )}

      {/* Character Select Screen */}
      {gameState === 'character_select' && (
        <CharacterSelectScreen
          mode={gameMode}
          onSelectCharacter={(charId, twinId) => startGameWithChar(charId, twinId)}
          onBack={() => setGameState('title')}
        />
      )}

      {/* Roguelite 3-Card Level Up Modal */}
      {gameState === 'levelup' && playerState && (
        <UpgradeModal
          upgrades={currentUpgrades}
          player={playerState}
          onSelectUpgrade={handleSelectUpgrade}
          onReroll={handleReroll}
          rerollsRemaining={playerState.rerollCount || 0}
          infiniteRerolls={infiniteReroll}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && playerState && (
        <PauseModal
          player={playerState}
          upgradeLevels={upgradeLevels}
          gameTime={gameTime}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          infiniteReroll={infiniteReroll}
          onToggleInfiniteReroll={toggleInfiniteReroll}
          debugTrace={debugTrace}
          onToggleDebugTrace={handleToggleDebugTrace}
          onResume={resumeGame}
          onRestart={() => startGameWithChar(selectedCharacterId, twinPilotId || undefined)}
          onHome={() => setGameState('character_select')}
          onOpenCodex={(k) => handleOpenCodex(k)}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && endStats && (
        <GameOverModal
          stats={endStats}
          highScore={highScore}
          onRestart={() => startGameWithChar(selectedCharacterId, twinPilotId || undefined)}
          onHome={() => setGameState('character_select')}
          onOpenCodex={() => handleOpenCodex()}
        />
      )}

      {/* All-Upgrades Codex & Tech Archives Modal */}
      <CodexModal
        isOpen={isCodexOpen}
        onClose={handleCloseCodex}
        currentUpgradeLevels={playerState?.upgradeLevels || upgradeLevels}
        initialSelectedKey={codexInitialKey}
      />
    </div>
  );
}
