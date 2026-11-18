/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tanashvi Fintech Private Limited (ARN-347849 / BSE Member 94515)
 * Phase 16: "Tanu" — Cute Animated Wise Owl SVG Character
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TanuMood } from '../utils/tanuStoryEngine';

interface TanuOwlMascotProps {
  mood: TanuMood;
  isSpeaking?: boolean;
  isWalking?: boolean;
  pointDirection?: 'left' | 'right';
  size?: number;
}

export const TanuOwlMascot: React.FC<TanuOwlMascotProps> = ({
  mood,
  isSpeaking = false,
  isWalking = false,
  pointDirection = 'right',
  size = 155
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic natural eye blink
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      const t = setTimeout(() => setIsBlinking(false), 160);
      return () => clearTimeout(t);
    }, 3400);
    return () => clearInterval(interval);
  }, []);

  const isJoyful = mood === 'HAPPY' || mood === 'CELEBRATING';
  const isThinking = mood === 'THINKING';
  const isReassuring = mood === 'REASSURING';
  const isWaving = mood === 'WAVING';
  const isPointing = mood === 'POINTING';

  return (
    <motion.div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center select-none"
      animate={
        isWalking
          ? { y: [0, -10, 0, -8, 0], rotate: [-3, 3, -3, 2, 0] }
          : isJoyful
          ? { y: [0, -7, 0] }
          : { y: [0, -3.5, 0] }
      }
      transition={
        isWalking
          ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
          : { duration: isJoyful ? 1.4 : 2.6, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg viewBox="0 0 180 185" className="w-full h-full overflow-visible drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]">
        <defs>
          <linearGradient id="tanuBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f2340" />
          </linearGradient>
          <linearGradient id="tanuBellyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef9e7" />
            <stop offset="100%" stopColor="#f3e1b0" />
          </linearGradient>
          <linearGradient id="tanuGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6c882" />
            <stop offset="100%" stopColor="#b88c3e" />
          </linearGradient>
        </defs>

        {/* Ground Shadow */}
        <motion.ellipse
          cx="90"
          cy="172"
          rx="42"
          ry="8"
          fill="#020617"
          opacity="0.55"
          animate={isWalking ? { rx: [42, 34, 42] } : { rx: [42, 39, 42] }}
          transition={{ duration: isWalking ? 0.65 : 2.6, repeat: Infinity }}
        />

        {/* Celebratory Golden Sparkles */}
        {isJoyful && (
          <g>
            <motion.path
              d="M24 38 L27 30 L30 38 L38 41 L30 44 L27 52 L24 44 L16 41 Z"
              fill="#facc15"
              animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.path
              d="M150 28 L152.5 22 L155 28 L161 30.5 L155 33 L152.5 39 L150 33 L144 30.5 Z"
              fill="#c5a059"
              animate={{ scale: [1.1, 0.7, 1.1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <motion.circle
              cx="148"
              cy="64"
              r="3.2"
              fill="#34d399"
              animate={{ y: [-3, 3, -3], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </g>
        )}

        {/* Thinking Bubbles */}
        {isThinking && (
          <g>
            <motion.circle
              cx="148"
              cy="42"
              r="4"
              fill="#94a3b8"
              opacity="0.7"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.circle
              cx="159"
              cy="28"
              r="6.5"
              fill="#cbd5e1"
              opacity="0.85"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity }}
            />
          </g>
        )}

        {/* Feet (animated stepping when walking) */}
        <motion.g
          animate={isWalking ? { y: [0, -6, 0], rotate: [-8, 8, -8] } : { y: 0, rotate: 0 }}
          transition={{ duration: 0.35, repeat: isWalking ? Infinity : 0 }}
          style={{ originX: '72px', originY: '154px' }}
        >
          <path d="M64 156 L59 166 M72 156 L72 167 M79 156 L83 166" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
        </motion.g>
        <motion.g
          animate={isWalking ? { y: [-6, 0, -6], rotate: [8, -8, 8] } : { y: 0, rotate: 0 }}
          transition={{ duration: 0.35, repeat: isWalking ? Infinity : 0 }}
          style={{ originX: '108px', originY: '154px' }}
        >
          <path d="M101 156 L97 166 M108 156 L108 167 M116 156 L121 166" stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" />
        </motion.g>

        {/* Left Wing */}
        <motion.path
          d="M42 86 C20 96, 18 128, 38 142 C48 148, 52 132, 50 112 Z"
          fill="url(#tanuBodyGrad)"
          stroke="#c5a059"
          strokeWidth="2"
          style={{ originX: '46px', originY: '94px' }}
          animate={
            isJoyful
              ? { rotate: [25, 45, 25] }
              : isPointing && pointDirection === 'left'
              ? { rotate: 52 }
              : isReassuring
              ? { rotate: 8 }
              : { rotate: [0, 5, 0] }
          }
          transition={{ duration: isJoyful ? 0.6 : 2.2, repeat: isJoyful ? Infinity : isPointing ? 0 : Infinity }}
        />

        {/* Right Wing (Waves or Points Right!) */}
        <motion.path
          d="M138 86 C160 96, 162 128, 142 142 C132 148, 128 132, 130 112 Z"
          fill="url(#tanuBodyGrad)"
          stroke="#c5a059"
          strokeWidth="2"
          style={{ originX: '134px', originY: '94px' }}
          animate={
            isWaving
              ? { rotate: [-42, -68, -36, -65, -42] }
              : isJoyful
              ? { rotate: [-25, -45, -25] }
              : isPointing && pointDirection === 'right'
              ? { rotate: -55 }
              : isThinking
              ? { rotate: -28 }
              : { rotate: [0, -5, 0] }
          }
          transition={{ duration: isWaving ? 1.1 : isJoyful ? 0.6 : 2.2, repeat: isPointing || isThinking ? 0 : Infinity }}
        />

        {/* Cute Ear Tufts with Gold Tips */}
        <path d="M52 46 L40 20 L68 36 Z" fill="#1e3a5f" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />
        <path d="M40 20 L48 30 L53 26 Z" fill="url(#tanuGoldGrad)" />
        <path d="M128 46 L140 20 L112 36 Z" fill="#1e3a5f" stroke="#c5a059" strokeWidth="2" strokeLinejoin="round" />
        <path d="M140 20 L132 30 L127 26 Z" fill="url(#tanuGoldGrad)" />

        {/* Main Rounded Owl Body */}
        <ellipse cx="90" cy="96" rx="54" ry="62" fill="url(#tanuBodyGrad)" stroke="#c5a059" strokeWidth="2.5" />

        {/* Soft Cream Belly */}
        <ellipse cx="90" cy="118" rx="37" ry="37" fill="url(#tanuBellyGrad)" />

        {/* Subtle Golden Feather Scallops on Belly */}
        <path
          d="M70 112 Q75 118 80 112 M85 112 Q90 118 95 112 M100 112 Q105 118 110 112"
          fill="none"
          stroke="#c5a059"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M76 125 Q81 131 86 125 M94 125 Q99 131 104 125"
          fill="none"
          stroke="#c5a059"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Tanashvi Gold Scarf / Collar Accent */}
        <path
          d="M54 96 Q90 110 126 96 Q124 104 90 116 Q56 104 54 96 Z"
          fill="url(#tanuGoldGrad)"
          opacity="0.92"
        />
        {/* Little Lotus Gold Medallion */}
        <circle cx="90" cy="109" r="5" fill="#0f2340" stroke="#fef08a" strokeWidth="1.4" />
        <circle cx="90" cy="109" r="2" fill="#facc15" />

        {/* Facial Disc (Heart-shaped Owl Face) */}
        <path
          d="M46 68 C46 44, 78 42, 90 56 C102 42, 134 44, 134 68 C134 89, 114 96, 90 94 C66 96, 46 89, 46 68 Z"
          fill="#f8fafc"
          opacity="0.96"
        />

        {/* Eyes */}
        {isJoyful ? (
          /* Happy Smiling Crescent Eyes */
          <g stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M59 71 Q69 60 79 71" />
            <path d="M101 71 Q111 60 121 71" />
          </g>
        ) : isBlinking ? (
          /* Blinking Eyes */
          <g stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round">
            <line x1="59" y1="70" x2="79" y2="70" />
            <line x1="101" y1="70" x2="121" y2="70" />
          </g>
        ) : (
          /* Big Expressive Wise Eyes */
          <g>
            {/* Left Eye */}
            <circle cx="69" cy="69" r="11.5" fill="#0f172a" />
            <circle cx={isThinking ? 72 : 70} cy={isThinking ? 66 : 68} r="4.2" fill="#ffffff" />
            <circle cx="65" cy="73" r="1.8" fill="#ffffff" opacity="0.85" />

            {/* Right Eye */}
            <circle cx="111" cy="69" r="11.5" fill="#0f172a" />
            <circle cx={isThinking ? 114 : 112} cy={isThinking ? 66 : 68} r="4.2" fill="#ffffff" />
            <circle cx="107" cy="73" r="1.8" fill="#ffffff" opacity="0.85" />

            {/* Reassuring Gentle Eyebrows */}
            {isReassuring && (
              <g stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round">
                <path d="M58 55 Q68 52 78 57" fill="none" />
                <path d="M122 55 Q112 52 102 57" fill="none" />
              </g>
            )}
          </g>
        )}

        {/* Cute Wise Gold Spectacles */}
        <g stroke="#c5a059" strokeWidth="2.4" fill="none">
          <circle cx="69" cy="69" r="15.5" />
          <circle cx="111" cy="69" r="15.5" />
          <path d="M84.5 69 Q90 65 95.5 69" />
        </g>

        {/* Cute Rosy Cheeks */}
        <ellipse cx="52" cy="80" rx="5.5" ry="3" fill="#fda4af" opacity="0.55" />
        <ellipse cx="128" cy="80" rx="5.5" ry="3" fill="#fda4af" opacity="0.55" />

        {/* Animated Speaking Beak */}
        <motion.g
          animate={isSpeaking ? { scaleY: [1, 1.35, 0.9, 1.25, 1] } : { scaleY: 1 }}
          transition={{ duration: 0.38, repeat: isSpeaking ? Infinity : 0 }}
          style={{ originX: '90px', originY: '78px' }}
        >
          <path d="M84 77 L96 77 L90 89 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
          {isSpeaking && <ellipse cx="90" cy="83" rx="3" ry="2.2" fill="#7c2d12" />}
        </motion.g>
      </svg>
    </motion.div>
  );
};
