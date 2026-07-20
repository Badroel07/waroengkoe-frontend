import { useState, useRef, useEffect, type ReactNode } from 'react';
import Icon from './Icon';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'left' | 'right';
  children?: ReactNode;
  className?: string;
}

export default function Tooltip({ text, position = 'top', align = 'center', children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  const getPosClass = () => {
    if (position === 'top') {
      if (align === 'right') return 'bottom-full right-0 mb-3';
      if (align === 'left') return 'bottom-full left-0 mb-3';
      return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
    }
    if (position === 'bottom') {
      if (align === 'right') return 'top-full right-0 mt-3';
      if (align === 'left') return 'top-full left-0 mt-3';
      return 'top-full left-1/2 -translate-x-1/2 mt-3';
    }
    if (position === 'left') return 'right-full top-1/2 -translate-y-1/2 mr-3';
    if (position === 'right') return 'left-full top-1/2 -translate-y-1/2 ml-3';
    return '';
  };

  const getArrowClass = () => {
    if (position === 'top') {
      const base = 'top-full border-t-slate-900 dark:border-t-slate-800';
      if (align === 'right') return `${base} right-2`;
      if (align === 'left') return `${base} left-2`;
      return `${base} left-1/2 -translate-x-1/2`;
    }
    if (position === 'bottom') {
      const base = 'bottom-full border-b-slate-900 dark:border-b-slate-800';
      if (align === 'right') return `${base} right-2`;
      if (align === 'left') return `${base} left-2`;
      return `${base} left-1/2 -translate-x-1/2`;
    }
    if (position === 'left') return 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800';
    if (position === 'right') return 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800';
    return '';
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div
        onClick={handleToggle}
        className="cursor-help inline-flex items-center justify-center p-0.5"
      >
        {children || (
          <Icon name="help" className="text-[12px] text-slate-500 dark:text-slate-600 hover:text-[#006eff] transition-colors" />
        )}
      </div>

      {isVisible && (
        <div className={`absolute z-[9999] w-48 p-3 bg-slate-900 dark:bg-slate-800 border border-slate-700/50 dark:border-slate-700 rounded-xl text-[11px] text-slate-100 font-medium shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none leading-relaxed text-center ${getPosClass()}`}>
          <div className="relative z-10">
            {text}
          </div>
          <div className={`absolute w-0 h-0 border-[6px] border-transparent -ml-1 ${getArrowClass()}`}></div>
        </div>
      )}
    </div>
  );
}
