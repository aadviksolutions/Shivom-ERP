"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface FrameSequencePlayerProps {
  className?: string;
  onComplete?: () => void;
  showReplayButton?: boolean;
}

const TOTAL_FRAMES = 240;
const DURATION_MS = 8000; // Exact 8.0 seconds
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

// Module-level cache so images are only fetched and decoded once across components and re-renders
const globalImageCache: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
let globalPreloadStarted = false;

function getFrameUrl(index: number): string {
  const frameNum = String(index + 1).padStart(3, "0");
  return `/animation-frames/ezgif-frame-${frameNum}.jpg`;
}

function startGlobalPreloader() {
  if (globalPreloadStarted || typeof window === "undefined") return;
  globalPreloadStarted = true;

  // Frame 0 (first frame) is preloaded immediately with high priority
  const firstImg = new Image();
  firstImg.src = getFrameUrl(0);
  globalImageCache[0] = firstImg;

  // Frame 239 (final frame) preloaded early for fallback/hold
  const lastImg = new Image();
  lastImg.src = getFrameUrl(TOTAL_FRAMES - 1);
  globalImageCache[TOTAL_FRAMES - 1] = lastImg;

  // Concurrently preload remaining frames in order
  let currentIndex = 1;
  const CONCURRENCY = 6;

  function loadNext() {
    if (currentIndex >= TOTAL_FRAMES) return;
    const idx = currentIndex++;
    if (globalImageCache[idx]) {
      loadNext();
      return;
    }
    const img = new Image();
    img.src = getFrameUrl(idx);
    img.onload = () => {
      globalImageCache[idx] = img;
      loadNext();
    };
    img.onerror = () => {
      // Continue even if a frame fails
      loadNext();
    };
  }

  for (let i = 0; i < CONCURRENCY; i++) {
    loadNext();
  }
}

export default function FrameSequencePlayer({
  className = "",
  onComplete,
  showReplayButton = false,
}: FrameSequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  // Playback state refs for requestAnimationFrame
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const lastDrawnIndexRef = useRef<number>(-1);

  // Function to draw a specific frame index to canvas
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return false;

    // Look for target frame or closest previous loaded frame to avoid flickering
    let imgToDraw: HTMLImageElement | null = null;
    let foundIndex = frameIndex;

    for (let i = frameIndex; i >= 0; i--) {
      const cached = globalImageCache[i];
      if (cached && cached.complete && cached.naturalWidth > 0) {
        imgToDraw = cached;
        foundIndex = i;
        break;
      }
    }

    // If no prior frame found, check if frame 0 is loaded
    if (!imgToDraw) {
      const first = globalImageCache[0];
      if (first && first.complete && first.naturalWidth > 0) {
        imgToDraw = first;
        foundIndex = 0;
      }
    }

    if (imgToDraw) {
      ctx.drawImage(imgToDraw, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      lastDrawnIndexRef.current = foundIndex;
      if (!hasFirstFrame) setHasFirstFrame(true);
      return true;
    }
    return false;
  };

  const startAnimation = () => {
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Draw final frame or first frame and stay
      drawFrame(TOTAL_FRAMES - 1);
      setIsFinished(true);
      if (onComplete) onComplete();
      return;
    }

    setIsPlaying(true);
    setIsFinished(false);
    startTimeRef.current = performance.now();
    lastDrawnIndexRef.current = -1;

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / DURATION_MS);
      const targetIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));

      drawFrame(targetIndex);

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(tick);
      } else {
        // Animation completed: draw absolute final frame (frame 240) and hold
        drawFrame(TOTAL_FRAMES - 1);
        setIsPlaying(false);
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    };

    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    startGlobalPreloader();

    // Draw initial frame as soon as frame 0 loads
    const initialImg = globalImageCache[0];
    if (initialImg && initialImg.complete) {
      drawFrame(0);
    } else if (initialImg) {
      initialImg.onload = () => drawFrame(0);
    }

    // Start auto-playback once component mounts
    startAnimation();

    // Handle tab visibility change (pause when hidden, resume when visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
        pausedTimeRef.current = performance.now();
      } else {
        if (isPlaying && pausedTimeRef.current && startTimeRef.current) {
          const pauseDuration = performance.now() - pausedTimeRef.current;
          startTimeRef.current += pauseDuration;
          pausedTimeRef.current = null;

          const resumeTick = (now: number) => {
            if (!startTimeRef.current) startTimeRef.current = now;
            const elapsed = now - startTimeRef.current;
            const progress = Math.min(1, elapsed / DURATION_MS);
            const targetIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));

            drawFrame(targetIndex);

            if (progress < 1) {
              animFrameIdRef.current = requestAnimationFrame(resumeTick);
            } else {
              drawFrame(TOTAL_FRAMES - 1);
              setIsPlaying(false);
              setIsFinished(true);
              if (onComplete) onComplete();
            }
          };

          animFrameIdRef.current = requestAnimationFrame(resumeTick);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* High-performance hardware-accelerated Canvas element */}
      <canvas
        ref={canvasRef}
        width={FRAME_WIDTH}
        height={FRAME_HEIGHT}
        className="w-full h-full object-cover object-center"
      />

      {/* Fallback Static Poster underneath in case canvas hasn't drawn initial frame yet */}
      {!hasFirstFrame && (
        <img
          src={getFrameUrl(0)}
          alt="Shivom Construction Materials Yard"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
      )}

      {/* Subtle replay action if enabled or finished */}
      {showReplayButton && isFinished && (
        <button
          onClick={startAnimation}
          title="Replay Construction Yard Animation"
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-[#e16718] text-white text-[11px] font-semibold px-3 py-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer group pointer-events-auto"
        >
          <RotateCcw className="h-3 w-3 group-hover:-rotate-45 transition-transform" />
          <span>Replay Video</span>
        </button>
      )}
    </div>
  );
}
