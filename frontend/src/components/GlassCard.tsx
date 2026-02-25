import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'glow';
  className?: string;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  onClick
}) => {
  const baseStyles = 'backdrop-blur-md bg-white/10 border border-white/20 rounded-lg shadow-lg';
  
  const variantStyles = {
    default: '',
    hover: 'transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 cursor-pointer',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]'
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
