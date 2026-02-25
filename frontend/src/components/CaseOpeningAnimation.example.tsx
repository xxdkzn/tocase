/**
 * Example usage of CaseOpeningAnimation component
 * 
 * This file demonstrates how to integrate the case opening animation
 * into your case opening flow.
 */

import React, { useState } from 'react';
import CaseOpeningAnimation from './CaseOpeningAnimation';
import { NFT } from '@/store/casesStore';

const CaseOpeningExample: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [wonNFT, setWonNFT] = useState<NFT | null>(null);

  // Example NFT data
  const winningNFT: NFT = {
    id: 1,
    name: 'Legendary Dragon',
    imageUrl: 'https://example.com/dragon.png',
    price: 500,
    rarity: 'Legendary',
  };

  const allNFTs: NFT[] = [
    {
      id: 2,
      name: 'Common Sword',
      imageUrl: 'https://example.com/sword.png',
      price: 10,
      rarity: 'Common',
    },
    {
      id: 3,
      name: 'Rare Shield',
      imageUrl: 'https://example.com/shield.png',
      price: 50,
      rarity: 'Rare',
    },
    {
      id: 4,
      name: 'Epic Armor',
      imageUrl: 'https://example.com/armor.png',
      price: 150,
      rarity: 'Epic',
    },
    // Add more NFTs to fill the reel
  ];

  const handleOpenCase = () => {
    setIsAnimating(true);
    // In real implementation, call your API to open the case
    // and get the winning NFT from the server
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setWonNFT(winningNFT);
    // Show the won NFT details, update inventory, etc.
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Case Opening</h1>

      {!isAnimating && !wonNFT && (
        <button
          onClick={handleOpenCase}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Open Case
        </button>
      )}

      {isAnimating && (
        <div className="mt-4">
          <CaseOpeningAnimation
            winningNFT={winningNFT}
            allNFTs={allNFTs}
            onComplete={handleAnimationComplete}
          />
        </div>
      )}

      {wonNFT && !isAnimating && (
        <div className="mt-4 text-white">
          <h2 className="text-xl font-bold">You won!</h2>
          <p>{wonNFT.name}</p>
          <p className="text-yellow-400">${wonNFT.price}</p>
        </div>
      )}
    </div>
  );
};

export default CaseOpeningExample;
