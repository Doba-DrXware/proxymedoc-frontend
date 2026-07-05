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

  if (!resolvedSrc || hasError) {
    return (
      <div className={fallbackClassName ?? 'flex h-full w-full items-center justify-center bg-gradient-to-r from-green-500 to-green-700 text-white'}>
        <Building2 size={48} />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className ?? 'h-full w-full object-cover'}
      onError={() => setHasError(true)}
    />
  );
}
