'use client';

import { motion } from 'framer-motion';

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Main gradient overlay - Microsoft Loop inspired with purple and blue */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/50 via-blue-100/40 to-indigo-50/30" />

      {/* Animated gradient orbs - Microsoft Loop inspired with purple and blue */}
      <motion.div
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(124, 58, 237, 0.3) 40%, rgba(99, 102, 241, 0.1) 70%, transparent 100%)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/4 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.3) 40%, rgba(29, 78, 216, 0.1) 70%, transparent 100%)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      <motion.div
        className="absolute bottom-10 right-1/4 w-[550px] h-[550px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(168, 85, 247, 0.25) 40%, rgba(192, 132, 252, 0.1) 70%, transparent 100%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5,
        }}
      />

      {/* Additional abstract purple shape - Loop style */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(109, 40, 217, 0.4) 0%, rgba(126, 34, 206, 0.2) 50%, transparent 100%)',
        }}
        animate={{
          x: [-20, 20, -20],
          y: [-30, 30, -30],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Geometric pattern overlay - Microsoft fluent design inspired */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-900"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating geometric shapes - Microsoft Loop style */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-40 h-40 border-2 border-purple-300/25 rounded-3xl rotate-12 backdrop-blur-sm"
        animate={{
          y: [0, -30, 0],
          rotate: [12, 25, 12],
          borderColor: ['rgba(216, 180, 254, 0.25)', 'rgba(192, 132, 252, 0.35)', 'rgba(216, 180, 254, 0.25)'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-32 h-32 border-2 border-blue-400/25 rounded-full backdrop-blur-sm"
        animate={{
          y: [0, 40, 0],
          x: [0, 25, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      />

      <motion.div
        className="absolute top-2/3 right-1/3 w-28 h-28 border-2 border-indigo-400/30 rounded-2xl rotate-45 backdrop-blur-sm"
        animate={{
          y: [0, -35, 0],
          rotate: [45, 65, 45],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
      />

      {/* Abstract curved shapes - Loop inspired */}
      <motion.div
        className="absolute top-1/3 right-1/2 w-36 h-36 border-2 border-purple-400/20 rounded-full backdrop-blur-sm"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 100%)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Light rays effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
    </div>
  );
}
