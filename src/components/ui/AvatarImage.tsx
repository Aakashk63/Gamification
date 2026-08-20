import React, { useState, useEffect } from 'react';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  isLoadingData?: boolean;
  fallbackSrc?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  src, 
  className = '', 
  alt = 'Avatar', 
  isLoadingData = false,
  fallbackSrc,
  ...props 
}) => {
  const defaultFallback = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80';
  const effectiveSrc = src || fallbackSrc || defaultFallback;
  const [currentSrc, setCurrentSrc] = useState<string>(effectiveSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || defaultFallback);
    setHasError(false);
  }, [src, fallbackSrc]);

  if (isLoadingData) {
    return <div className={`bg-slate-800 animate-pulse ${className}`} />;
  }

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc || defaultFallback);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="eager"
      {...props}
    />
  );
};

