import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTelegramWebApp } from '@/utils/telegram';
import { audioManager } from '@/services/audioManager';

interface NFT {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

interface CaseOpeningAnimationProps {
  winningNFT: NFT;
  allNFTs: NFT[];
  onComplete: () => void;
}

const SLOT_WIDTH = 128; // NFT card width
const SLOT_GAP = 8; // Gap between slots
const TOTAL_SLOT_WIDTH = SLOT_WIDTH + SLOT_GAP; // 136px
const TOTAL_SLOTS = 50;
const WINNING_SLOT_INDEX = 25; // Middle of the reel
const SCROLL_DISTANCE = WINNING_SLOT_INDEX * TOTAL_SLOT_WIDTH; // 3400px

const CaseOpeningAnimation: React.FC<CaseOpeningAnimationProps> = ({
  winningNFT,
  allNFTs,
  onComplete,
}) => {
  const controls = useAnimation();
  const { webApp } = useTelegramWebApp();
  const [showGlow, setShowGlow] = useState(false);
  const [blur, setBlur] = useState(0);
  const hasCompletedRef = useRef(false);

  // Generate reel with 50 slots
  const reelSlots = React.useMemo(() => {
    if (!allNFTs || allNFTs.length === 0) {
      return Array(TOTAL_SLOTS).fill(winningNFT);
    }

    const slots: NFT[] = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      if (i === WINNING_SLOT_INDEX) {
        slots.push(winningNFT);
      } else {
        // Fill with random NFTs from allNFTs
        const randomIndex = Math.floor(Math.random() * allNFTs.length);
        slots.push(allNFTs[randomIndex]);
      }
    }
    return slots;
  }, [winningNFT, allNFTs]);

  // Rarity-based glow colors
  const rarityGlowColors = {
    Common: 'rgba(59, 130, 246, 0.6)',
    Rare: 'rgba(168, 85, 247, 0.6)',
    Epic: 'rgba(236, 72, 153, 0.6)',
    Legendary: 'rgba(234, 179, 8, 0.6)',
  };

  useEffect(() => {
    const runAnimation = async () => {
      // Start reel-spin sound (looping)
      audioManager.play('reel-spin', true);

      // Phase 1: Fast acceleration (0-1s) - scroll 1000px
      await controls.start({
        x: -1000,
        transition: {
          duration: 1,
          ease: 'easeIn',
        },
      });
      setBlur(4);

      // Phase 2: Deceleration (1-4s) - scroll remaining 2400px
      await controls.start({
        x: -SCROLL_DISTANCE,
        transition: {
          duration: 3,
          ease: [0.25, 0.1, 0.25, 1], // cubic-bezier
        },
      });

      // Phase 3: Final settle (4-5s) - spring animation
      await controls.start({
        x: -SCROLL_DISTANCE,
        transition: {
          type: 'spring',
          damping: 20,
          stiffness: 100,
          duration: 1,
        },
      });

      // Stop reel-spin sound
      audioManager.stop('reel-spin');

      // Remove blur
      setBlur(0);

      // Play reveal sound
      audioManager.play('reveal');

      // Trigger haptic feedback
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred('heavy');
      }

      // Show glow effect
      setShowGlow(true);

      // Trigger confetti and legendary sound for Legendary drops
      if (winningNFT.rarity === 'Legendary') {
        audioManager.play('legendary');
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#EAB308'],
          ticks: 300,
          gravity: 1,
          scalar: 1.2,
        });
      }

      // Call onComplete after a short delay
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    };

    runAnimation();

    // Cleanup - stop all sounds on unmount
    return () => {
      hasCompletedRef.current = true;
      audioManager.stop('reel-spin');
    };
  }, [controls, webApp, winningNFT.rarity, onComplete]);

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-black/30 rounded-lg">
      {/* Center indicator line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-yellow-400 to-transparent z-10 transform -translate-x-1/2" />

      {/* Scrolling reel */}
      <motion.div
        className="flex gap-2 h-full items-center pl-[calc(50%-64px)]"
        animate={controls}
        style={{
          filter: `blur(${blur}px)`,
          willChange: 'transform',
        }}
        transition={{
          filter: { duration: 0.3 },
        }}
      >
        {reelSlots.map((nft, index) => {
          const isWinning = index === WINNING_SLOT_INDEX && showGlow;
          const glowColor = rarityGlowColors[nft.rarity as keyof typeof rarityGlowColors];

          return (
            <div
              key={`slot-${index}`}
              className="flex-shrink-0 relative"
              style={{
                width: `${SLOT_WIDTH}px`,
                height: `${SLOT_WIDTH}px`,
              }}
            >
              <div
                className={`w-full h-full rounded-lg overflow-hidden bg-gray-800 transition-all duration-500 ${
                  isWinning ? 'scale-110' : ''
                }`}
                style={{
                  boxShadow: isWinning
                    ? `0 0 30px 10px ${glowColor}, 0 0 60px 20px ${glowColor}`
                    : 'none',
                }}
              >
                <img
                  src={nft.imageUrl}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback for missing images
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23374151" width="128" height="128"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-family="sans-serif" font-size="14"%3ENFT%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Rarity indicator */}
              <div
                className={`absolute bottom-1 left-1 right-1 text-center text-xs font-bold py-0.5 rounded ${
                  nft.rarity === 'Common'
                    ? 'bg-blue-500/80'
                    : nft.rarity === 'Rare'
                    ? 'bg-purple-500/80'
                    : nft.rarity === 'Epic'
                    ? 'bg-pink-500/80'
                    : 'bg-yellow-500/80'
                } text-white`}
              >
                {nft.rarity}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black via-transparent to-black" />
    </div>
  );
};

export default CaseOpeningAnimation;
