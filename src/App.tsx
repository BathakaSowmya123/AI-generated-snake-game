import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Terminal } from 'lucide-react';

const GRID_SIZE = 20;

const TRACKS = [
  {
    title: 'SYS.TRK_01.MP3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    title: 'DATA_STREAM.WAV',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    title: 'VOID_NOISE.OGG',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

type Point = { x: number; y: number };

function getRandomFoodPosition(snake: Point[]): Point {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    if (!snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
}

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [speed, setSpeed] = useState(150);

  const dirRef = useRef<Point>({ x: 0, y: -1 });
  const pendingDirRef = useRef<Point>({ x: 0, y: -1 });

  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize Game
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(getRandomFoodPosition([{ x: 10, y: 10 }]));
    dirRef.current = { x: 0, y: -1 };
    pendingDirRef.current = { x: 0, y: -1 };
    setGameOver(false);
    setScore(0);
    setSpeed(150);
    setIsGameRunning(true);
  };

  // Game Loop
  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        dirRef.current = pendingDirRef.current;
        const head = prevSnake[0];
        const newHead = {
          x: head.x + dirRef.current.x,
          y: head.y + dirRef.current.y,
        };

        // Collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Collision with self
        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => s + 10);
          setFood(getRandomFoodPosition(newSnake));
          setSpeed((s) => Math.max(50, s - 5));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [isGameRunning, gameOver, speed, food]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      if (e.key === ' ' && !gameOver) {
        setIsGameRunning((prev) => !prev);
        return;
      }

      if (!isGameRunning) return;

      const currentDir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) pendingDirRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) pendingDirRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) pendingDirRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) pendingDirRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  // Audio
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="fixed inset-0 screen-noise z-40"></div>
      <div className="fixed inset-0 scanline z-50 pointer-events-none"></div>
      
      <header className="mb-6 z-10 w-full max-w-2xl border-b-4 border-[#ff00ff] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-display uppercase tracking-tighter text-[#00ffff] glitch-text" data-text="OS.EXEC(SNAKE)">
            OS.EXEC(SNAKE)
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[#ff00ff]">KERNEL_PANIC: IMMINENT / v.0.9.8.4</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#00ffff] opacity-80 uppercase">MEM. ADDR</div>
          <div className="font-bold text-lg text-[#ff00ff]">0x{score.toString(16).padStart(4, '0').toUpperCase()}</div>
        </div>
      </header>

      <main className="z-10 relative border-4 border-[#00ffff] bg-black p-1 shadow-[8px_8px_0_0_#ff00ff]">
        <div 
          className="relative bg-[#001111]"
          style={{ width: 'min(85vw, 400px)', height: 'min(85vw, 400px)' }}
        >
          {/* Grid Background */}
          <div 
            className="w-full h-full grid absolute inset-0 opacity-20 pointer-events-none"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              backgroundImage: 'linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)',
              backgroundSize: '5% 5%',
            }}
          />

          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className="absolute w-[5%] h-[5%]"
                style={{
                  left: `${(x / GRID_SIZE) * 100}%`,
                  top: `${(y / GRID_SIZE) * 100}%`,
                  backgroundColor: isHead 
                    ? '#ff00ff' 
                    : isBody 
                      ? '#00ffff' 
                      : isFood 
                        ? '#ffff00' 
                        : 'transparent',
                  border: isBody || isHead ? '1px solid black' : 'none'
                }}
              />
            )
          })}

          {!isGameRunning && !gameOver && score === 0 && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 text-center cursor-pointer" onClick={resetGame}>
              <div className="text-[#00ffff] text-xl font-display mb-4 glitch-text" data-text="INIT_SEQ">INIT_SEQ</div>
              <p className="text-xs text-[#ff00ff] blink animate-pulse">AWAITING USER INPUT...</p>
            </div>
          )}

          {!isGameRunning && !gameOver && score > 0 && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center cursor-pointer" onClick={() => setIsGameRunning(true)}>
               <div className="text-[#ffff00] text-xl font-display glitch-text" data-text="INTERRUPT">INTERRUPT</div>
             </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-display text-[#ff00ff] glitch-text mb-2" data-text="FATAL_ERR">FATAL_ERR</h2>
              <div className="text-xs text-[#00ffff] bg-[#ff00ff]/20 px-2 py-1 mb-8">SEGMENTATION FAULT AT {snake[0].x}x{snake[0].y}</div>
              <button 
                onClick={resetGame}
                className="border-2 border-[#00ffff] bg-black text-[#00ffff] px-4 py-2 uppercase hover:bg-[#00ffff] hover:text-black font-bold transition-none"
              >
                REBOOT()
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="z-10 mt-8 w-full max-w-2xl border-4 border-[#ff00ff] bg-black p-3 relative shadow-[8px_8px_0_0_#00ffff]">
        <audio
          ref={audioRef}
          src={TRACKS[currentTrackIndex].url}
          onEnded={() => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)}
          preload="auto"
        />
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Terminal className="text-[#ff00ff] animate-pulse" size={20} />
            <span className="text-[#ff00ff] text-sm uppercase">AUDIO.SYS</span>
          </div>

          <div className="flex-1 px-4 overflow-hidden">
             <div className="text-xs text-[#00ffff] whitespace-nowrap overflow-hidden text-ellipsis flex items-center">
               <span className={isPlaying ? "animate-pulse" : ""}>&gt; PLAYING: {TRACKS[currentTrackIndex].title}</span>
             </div>
          </div>

          <div className="flex gap-2 text-[#00ffff]">
            <button onClick={() => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length)} className="hover:text-[#ff00ff] active:translate-y-1 p-1 bg-[#00ffff]/10 border border-[#00ffff]">
              <SkipBack size={16} />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-[#ff00ff] active:translate-y-1 p-1 bg-[#00ffff]/10 border border-[#00ffff]">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length)} className="hover:text-[#ff00ff] active:translate-y-1 p-1 bg-[#00ffff]/10 border border-[#00ffff]">
              <SkipForward size={16} />
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="hover:text-[#ff00ff] active:translate-y-1 p-1 bg-[#ff00ff]/10 border border-[#ff00ff] ml-2 text-[#ff00ff]">
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

