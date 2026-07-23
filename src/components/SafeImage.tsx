'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export default function SafeImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || DEFAULT_FALLBACK);

  useEffect(() => {
    setImgSrc(src || DEFAULT_FALLBACK);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width || 800 : undefined}
      height={!fill ? height || 600 : undefined}
      priority={priority}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      unoptimized
      onError={() => {
        if (imgSrc !== DEFAULT_FALLBACK) {
          setImgSrc(DEFAULT_FALLBACK);
        }
      }}
      className={className}
    />
  );
}
