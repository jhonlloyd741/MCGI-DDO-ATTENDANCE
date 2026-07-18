import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  duration?: number; // duration in ms
  onFinished?: () => void;
  message?: string;
}

export function LoadingScreen({ duration = 1500, onFinished, message = "Initializing Secure Environment..." }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress interval animation
    const intervalTime = duration / 50;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, intervalTime);

    // Timeout to finish
    const timeout = setTimeout(() => {
      setVisible(false);
      if (onFinished) {
        setTimeout(onFinished, 400); // allow fadeout animation
      }
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration, onFinished]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#031424] text-white"
        >
          {/* Subtle cosmic background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-yellow-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
            {/* Spinning Gold & Blue Halo Rings */}
            <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
              {/* Spinning outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-t-[#FFD700] border-r-transparent border-b-[#0A3D91] border-l-transparent shadow-[0_0_15px_rgba(255,215,0,0.2)]"
              />
              
              {/* Counter-spinning inner ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2 border-b-[#FFD700] border-l-transparent border-t-[#0A3D91] border-r-transparent opacity-80"
              />

              {/* Glowing core badge */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="absolute inset-4 bg-gradient-to-br from-[#0A3D91] to-[#041a3f] rounded-full flex items-center justify-center shadow-lg border border-white/10"
              >
                <span className="text-[#FFD700] font-black text-2xl tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  MCGI
                </span>
              </motion.div>
            </div>

            {/* Typography */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-xl font-black tracking-widest text-[#FFD700] uppercase mb-1">
                DAVAO DE ORO PORTAL
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-slate-300 uppercase mb-6">
                Attendance & Registry System
              </p>
            </motion.div>

            {/* Progress indicator */}
            <div className="w-48 bg-slate-800/60 rounded-full h-1.5 p-0.5 overflow-hidden border border-white/5 mb-4">
              <motion.div 
                className="bg-gradient-to-r from-[#0A3D91] via-[#0D4FC1] to-[#FFD700] h-full rounded-full"
                style={{ width: `${progress}%` }}
                layoutId="loading-progress"
              />
            </div>

            {/* Simulated actions list */}
            <motion.p 
              key={progress < 40 ? 'db' : progress < 80 ? 'sync' : 'ready'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-mono text-slate-400 select-none tracking-wide"
            >
              {progress < 40 
                ? '⚡ Connecting to local IndexedDB store...' 
                : progress < 80 
                  ? '🔄 Synchronizing offline cache elements...' 
                  : '✨ Secure environment fully synchronized'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
