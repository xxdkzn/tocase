import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const getWebPUrl = (url: string) => {
    // Check if URL already has an extension
    const hasExtension = /\.(jpg|jpeg|png|gif)$/i.test(url);
    if (hasExtension) {
      return url.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    }
    return url;
  };

  const webpSrc = getWebPUrl(src);

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={`transition-all duration-300 ${
          isLoaded ? 'blur-0' : 'blur-md'
        } ${className}`}
        onLoad={() => setIsLoaded(true)}
      />
    </picture>
  );
};

export default OptimizedImage;
