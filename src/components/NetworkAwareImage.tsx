import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { onNetworkRestore } from '@/hooks/useNetworkStatus';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';

interface NetworkAwareImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'auto' | 'high' | 'low';
  fallbackIcon?: string;
  fallbackIconClass?: string;
  fallbackClassName?: string;
  [key: string]: any;
}

const NetworkAwareImage = memo(({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  fallbackIcon = 'inventory_2',
  fallbackIconClass = 'text-4xl',
  fallbackClassName = '',
  ...props
}: NetworkAwareImageProps) => {
  const [status, setStatus] = useState<string>('loading');
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);
  const retryCountRef = useRef<number>(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const maxRetries = 3;

  useEffect(() => {
    setImgSrc(src);
    setStatus('loading');
    retryCountRef.current = 0;
  }, [src]);

  const handleLoad = useCallback(() => {
    setStatus('loaded');
    retryCountRef.current = 0;
  }, []);

  const handleError = useCallback(() => {
    if (status === 'retrying' && retryCountRef.current < maxRetries && src) {
      setTimeout(() => {
        const separator = src.includes('?') ? '&' : '?';
        setImgSrc(`${src}${separator}_retry=${Date.now()}`);
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [status, src]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        handleLoad();
      } else if (imgRef.current.naturalWidth === 0) {
        handleError();
      }
    }
  }, [imgSrc, handleLoad, handleError]);

  useEffect(() => {
    if (status !== 'error' || !src) return;

    const unsubscribe = onNetworkRestore(() => {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setStatus('retrying');
        const separator = src.includes('?') ? '&' : '?';
        setImgSrc(`${src}${separator}_retry=${Date.now()}`);
      }
    });

    return unsubscribe;
  }, [status, src]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center ${fallbackClassName || className}`}>
        <Icon name={fallbackIcon} className={fallbackIconClass} />
      </div>
    );
  }

  const showSkeleton = status === 'loading' || status === 'retrying';

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imgSrc ?? undefined}
        alt={alt}
        loading={loading}
        className={`${className} ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {showSkeleton && (
        <Skeleton className="absolute inset-0 z-10 !rounded-none" />
      )}

      {status === 'retrying' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-black/60 px-3 py-1 rounded-full border border-white/10">
            <span className="text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">
              Menyambungkan...
            </span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-850 z-10">
          <div className="flex flex-col items-center gap-1">
            <Icon name="cloud_off" className="text-slate-400 dark:text-slate-600 text-2xl" />
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              Offline
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

NetworkAwareImage.displayName = 'NetworkAwareImage';

export default NetworkAwareImage;
