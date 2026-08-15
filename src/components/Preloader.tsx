"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC04", "#34A853"];

const STATUS_MESSAGES = [
  "Initializing systems...",
  "Calibrating fluid engine...",
  "Loading developer community...",
  "Building masterpiece...",
  "Compiling experiences...",
  "Ready to launch.",
];

const CURTAIN_COLORS = ["#4285F4", "#EA4335", "#FBBC04", "#34A853"];

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [text, setText] = useState("");
  const fullText = "npm run build: masterpiece";

  // Progress bar increment
  useEffect(() => {
    // Lock scroll during preload
    document.body.style.overflow = 'hidden';

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 12;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => {
            setLoading(false);
            document.body.style.overflow = '';
          }, 1000);
        }, 400);
      }
      setProgress(Math.round(currentProgress));
      // Rotate status message roughly per 20% progress
      setStatusIdx(Math.min(Math.floor(currentProgress / 17), STATUS_MESSAGES.length - 1));
    }, 140);
    return () => {
      clearInterval(interval);
      document.body.style.overflow = '';
    };
  }, []);

  // Terminal typing animation (preserved from original)
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          className="fixed inset-0 z-[10000] bg-[#050505] overflow-hidden flex flex-col items-center justify-center"
        >
          {/* Giant editorial GDG outline letters */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span
              className="font-display text-[clamp(8rem,28vw,22rem)] leading-none tracking-tight"
              style={{
                WebkitTextStroke: "1px rgba(255,255,255,0.06)",
                color: "transparent",
                userSelect: "none",
              }}
            >
              GDG
            </span>
          </motion.div>

          {/* Animated Google-color accent bar */}
          <motion.div
            className="absolute top-0 left-0 h-[2px] flex w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {GOOGLE_COLORS.map((color, i) => (
              <motion.div
                key={color}
                className="h-full flex-1"
                style={{ backgroundColor: color }}
                initial={{ scaleX: 0, transformOrigin: "left" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: "circOut" }}
              />
            ))}
          </motion.div>

          {/* Terminal window */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 border border-white/10 bg-zinc-950/90 rounded-xl shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "circOut", delay: 0.2 }}
          >
            {/* macOS dots */}
            <div className="flex gap-2 px-4 py-3 border-b border-white/[0.06]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-auto text-[10px] text-white/20 font-body tracking-widest">TERMINAL</span>
            </div>

            <div className="p-5 space-y-4 font-mono text-sm">
              {/* Typing line */}
              <div className="flex items-center text-[#4285F4]">
                <span className="text-white/30 mr-2 select-none">$</span>
                <span>{text}</span>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                  className="inline-block w-[2px] h-[1em] bg-white ml-1 align-middle"
                />
              </div>

              {/* Status line */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={statusIdx}
                  className="text-xs text-white/40"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="text-[#34A853] mr-2">›</span>
                  {STATUS_MESSAGES[statusIdx]}
                </motion.div>
              </AnimatePresence>

              {/* Segmented progress bar */}
              <div>
                <div className="flex gap-[2px] h-[3px] rounded-full overflow-hidden bg-white/5">
                  {GOOGLE_COLORS.map((color, i) => {
                    const segStart = i * 25;
                    const segEnd = (i + 1) * 25;
                    const segFill = Math.max(0, Math.min(100, (progress - segStart) / 25 * 100));
                    return (
                      <div key={color} className="flex-1 overflow-hidden relative">
                        <motion.div
                          className="absolute inset-0 origin-left"
                          style={{ backgroundColor: color, scaleX: segFill / 100 }}
                          transition={{ ease: "linear" }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                  <span>Building chunks…</span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Curtain exit: 4 colored panels sweep up */}
          <AnimatePresence>
            {exiting && (
              <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 10 }}>
                {CURTAIN_COLORS.map((color, i) => (
                  <motion.div
                    key={color}
                    className="flex-1 h-full"
                    style={{ backgroundColor: color, willChange: 'transform' }}
                    initial={{ y: "100%" }}
                    animate={{ y: "-100%" }}
                    transition={{
                      duration: 0.7,
                      ease: [0.76, 0, 0.24, 1],
                      delay: i * 0.07,
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
