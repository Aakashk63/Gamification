import React, { useState, useEffect } from 'react';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  isLoadingData?: boolean;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ 
  src, 
  className, 
  alt, 
  isLoadingData = false,
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [src]);

  if (isLoadingData || !src) {
    return <div className={`bg-slate-800 animate-pulse ${className}`} />;
  }

  return (
    <>
      {!imageLoaded && (
        <div className={`bg-slate-800 animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt || "Avatar"}
        className={`${className} ${imageLoaded ? 'block' : 'hidden'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(true)}
        {...props}
      />
    </>
  );
};
