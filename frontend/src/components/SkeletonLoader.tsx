import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle';
  width?: string;
  height?: string;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  width,
  height,
  className = ''
}) => {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10 bg-[length:200%_100%]';
  
  const variantStyles = {
    card: 'rounded-lg',
    text: 'rounded h-4',
    circle: 'rounded-full'
  };

  const defaultSizes = {
    card: { width: 'w-full', height: 'h-64' },
    text: { width: 'w-full', height: 'h-4' },
    circle: { width: 'w-12', height: 'h-12' }
  };

  const widthClass = width || defaultSizes[variant].width;
  const heightClass = height || defaultSizes[variant].height;

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${widthClass} ${heightClass} ${className}`}
      style={{
        animation: 'shimmer 2s infinite'
      }}
      role="status"
      aria-label="Loading content"
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default SkeletonLoader;
