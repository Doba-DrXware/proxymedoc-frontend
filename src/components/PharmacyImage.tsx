'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

const resolveImageSrc = (value?: string | null) => {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(data:|https?:\/\/|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `http://localhost:8080${trimmed}`;
  }

  return trimmed;
};

type PharmacyImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function PharmacyImage({ src, alt, className, fallbackClassName }: PharmacyImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => resolveImageSrc(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setResolvedSrc(resolveImageSrc(src));
    setHasError(false);
  }, [src]);

  // Fixed 1:1 ratio box using padding-top trick so the image fills the box
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '100%', // 1 / 1 = 100%
    overflow: 'hidden',
  };

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  };

  if (!resolvedSrc || hasError) {
    return (
      <div style={wrapperStyle} className={fallbackClassName ?? ''}>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-green-500 to-green-700 text-white">
          <Building2 size={48} />
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <img
        src={resolvedSrc}
        alt={alt}
        className={className ?? 'absolute top-0 left-0 w-full h-full object-cover object-center'}
        style={imgStyle}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
