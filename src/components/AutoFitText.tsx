import { useState, useRef, useLayoutEffect, useCallback, type ReactNode } from 'react';

interface AutoFitTextProps {
  children: ReactNode;
  maxFontSize?: number;
  minFontSize?: number;
  className?: string;
  step?: number;
}

export default function AutoFitText({
  children,
  maxFontSize = 24,
  minFontSize = 12,
  className = "",
  step = 1
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const rafRef = useRef<number | null>(null);

  const calculateFontSize = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const containerWidth = container.clientWidth;

    let low = minFontSize;
    let high = maxFontSize;
    let optimalSize = minFontSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      text.style.fontSize = `${mid}px`;

      const textWidth = text.scrollWidth;

      if (textWidth <= containerWidth) {
        optimalSize = mid;
        low = mid + step;
      } else {
        high = mid - step;
      }
    }

    text.style.fontSize = `${optimalSize}px`;
    setFontSize(optimalSize);
  }, [maxFontSize, minFontSize, step]);

  useLayoutEffect(() => {
    const scheduleAdjustment = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateFontSize);
    };

    scheduleAdjustment();

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(scheduleAdjustment, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [children, calculateFontSize]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden whitespace-nowrap ${className}`}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <span
        ref={textRef}
        style={{ fontSize: `${fontSize}px` }}
        className="font-bold tracking-tight text-current"
      >
        {children}
      </span>
    </div>
  );
}
