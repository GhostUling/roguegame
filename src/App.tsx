/**
 * Geometric Overload - 几何超载
 * Web-based zero-asset roguelite geometric survivor game.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { sound } from './game/audio';
import { Player, UpgradeOption, GameStats, CharacterId } from './game/types';
import { getRandomUpgrades } from './game/upgrades';
import { VirtualJoystick } from './game/joystick';
import { HUD } from './components/HUD';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { StartScreen } from './components/StartScreen';
import { CharacterSelectScreen } from './components/CharacterSelectScreen';
import { CodexModal } from './components/CodexModal';

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

  // Initialize Canvas & Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onLevelUp: () => {
        if (!engineRef.current) return;
        const p = engineRef.current.player;
        const currentLevels = p.upgradeLevels || upgradeLevelsRef.current;
        const options = getRandomUpgrades(p, currentLevels);
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

  const startGameWithChar = useCallback((charId: CharacterId) => {
    setSelectedCharacterId(charId);
    const initialUpgrades: Record<string, number> =
      charId === 'epsilon_carrier' ? { summon_drone: 1 } : {};
    upgradeLevelsRef.current = initialUpgrades;
    setUpgradeLevels(initialUpgrades);
    setEndStats(null);
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.startNewGame(charId);
      engineRef.current.player.upgradeLevels = { ...initialUpgrades };
      if (charId === 'epsilon_carrier') {
        engineRef.current.player.activeSlots = ['summon_drone'];
      }
      setPlayerState(engineRef.current.player);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTriggerSkill = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerActiveSkill();
    }
  }, []);

  const handleReroll = useCallback(() => {
    if (!engineRef.current) return;
    const p = engineRef.current.player;
    if ((p.rerollCount || 0) > 0) {
      p.rerollCount--;
      const currentLevels = p.upgradeLevels || upgradeLevelsRef.current;
      const options = getRandomUpgrades(p, currentLevels);
      setCurrentUpgrades(options);
      setPlayerState({ ...p });
    }
  }, []);

  const handleSelectUpgrade = useCallback(
    (upgrade: UpgradeOption) => {
      if (!engineRef.current) return;
      const p = engineRef.current.player;

      if (!p.activeSlots) p.activeSlots = [];
      if (!p.activeSlots.includes(upgrade.key)) {
        p.activeSlots.push(upgrade.key);
      }

      upgrade.apply(p);

      if (!p.upgradeLevels) p.upgradeLevels = {};
      p.upgradeLevels[upgrade.key] = (p.upgradeLevels[upgrade.key] || 0) + 1;
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
          onToggleMute={toggleMute}
          onPause={pauseGame}
          onTriggerSkill={handleTriggerSkill}
        />
      )}

      {/* Start Title Screen */}
      {gameState === 'title' && (
        <StartScreen
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onStart={() => setGameState('character_select')}
          onOpenCodex={() => handleOpenCodex()}
        />
      )}

      {/* Character Select Screen */}
      {gameState === 'character_select' && (
        <CharacterSelectScreen
          onSelectCharacter={(charId) => startGameWithChar(charId)}
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
          onResume={resumeGame}
          onRestart={() => startGameWithChar(selectedCharacterId)}
          onHome={() => setGameState('character_select')}
          onOpenCodex={(k) => handleOpenCodex(k)}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && endStats && (
        <GameOverModal
          stats={endStats}
          highScore={highScore}
          onRestart={() => startGameWithChar(selectedCharacterId)}
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
