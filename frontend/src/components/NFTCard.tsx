import React, { useState } from 'react';
import GlassCard from './GlassCard';

interface NFTCardProps {
  nft: {
    name: string;
    imageUrl: string;
    price: number;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  };
  onClick?: () => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const rarityGlowColors = {
    Common: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    Rare: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    Epic: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    Legendary: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]'
  };

  return (
    <GlassCard 
      variant="hover" 
      className={`p-4 transition-all duration-300 hover:scale-105 ${rarityGlowColors[nft.rarity]} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-white/5">
        <img 
          src={nft.imageUrl} 
          alt={nft.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoaded ? 'blur-0' : 'blur-md'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
      <h3 className="text-white font-semibold text-lg mb-1 truncate">{nft.name}</h3>
      <p className="text-purple-300 font-medium">${nft.price.toFixed(2)}</p>
    </GlassCard>
  );
};

export default NFTCard;
