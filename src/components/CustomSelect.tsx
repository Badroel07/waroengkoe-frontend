import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import OverflowMarquee from '@/components/OverflowMarquee';

export interface CustomSelectOption {
  value?: string | number;
  label: string;
  icon?: string;
  count?: number;
  options?: CustomSelectOption[];
}

interface CustomSelectProps {
  id?: string;
  value: string | number;
  onChange?: (e: { target: { value: any } }) => void;
  options?: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  buttonClassName = '',
  disabled = false,
  size = 'md'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 256 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        const DROPDOWN_W = window.innerWidth - 32;
        setDropdownPos({ top: rect.bottom + 8, left: 16, width: DROPDOWN_W });
      } else {
        setDropdownPos({ top: rect.bottom + 6, left: 0, width: 0 });
      }
    }
    setIsOpen(prev => !prev);
  };

  let allOptions: CustomSelectOption[] = [];
  options.forEach(opt => {
    if (opt.options && Array.isArray(opt.options)) {
      allOptions.push(...opt.options);
    } else {
      allOptions.push(opt);
    }
  });
  const activeOption = allOptions.find(opt => String(opt.value) === String(value)) || { value: '', label: placeholder, icon: undefined, count: undefined };

  const isSm = size === 'sm';
  const btnPaddingClass = isSm ? 'px-2 py-1 pr-7 text-[11px]' : 'px-3 py-2 pr-10 text-sm';
  const chevronRightClass = isSm ? 'right-2' : 'right-3';
  const chevronSizeClass = isSm ? 'w-3 h-3' : 'w-4 h-4';
  const gapClass = isSm ? 'gap-1.5' : 'gap-2.5';
  const optionPaddingClass = isSm ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const isGrouped = options.some(opt => opt.options && Array.isArray(opt.options));

  return (
    <div ref={containerRef} className={`relative ${className.includes('w-') ? '' : 'w-full'} ${className}`}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full h-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg ${btnPaddingClass} text-left text-slate-900 dark:text-slate-100 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${buttonClassName}`}
      >
        <div className={`flex items-center ${gapClass} flex-1 min-w-0`}>
          {activeOption.icon && (
            <Icon name={activeOption.icon} className="text-slate-500 dark:text-slate-400 text-base flex-shrink-0" />
          )}
          <OverflowMarquee className="flex-1 min-w-0 text-left">{activeOption.label}</OverflowMarquee>
          {activeOption.count !== undefined && activeOption.count > 0 && (
            <span className="ml-2 px-2 py-0.5 min-w-[1.25rem] h-4 flex items-center justify-center rounded-full text-[10px] font-black bg-[#006eff] text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              {activeOption.count}
            </span>
          )}
        </div>
        <div className={`absolute ${chevronRightClass} top-1/2 -translate-y-1/2 pointer-events-none`}>
          <svg
            className={`${chevronSizeClass} text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && (
        <div
          style={window.innerWidth < 640 ? { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width } : undefined}
          className={`${
            window.innerWidth < 640
              ? 'fixed z-[200]'
              : 'absolute top-[calc(100%+6px)] left-0 right-0 z-50'
          } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden animate-fade-in-up`}
        >
          <div className={`overflow-y-auto max-h-60 ${
            isGrouped ? 'py-1' : 'divide-y divide-slate-100 dark:divide-slate-800/40'
          }`}>
            {options.map((groupOrOpt, idx) => {
              if (groupOrOpt.options && Array.isArray(groupOrOpt.options)) {
                return (
                  <div key={idx} className="py-1">
                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
                      {groupOrOpt.label}
                    </div>
                    {groupOrOpt.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange?.({ target: { value: opt.value } });
                          setIsOpen(false);
                        }}
                        className={`w-full ${optionPaddingClass} pl-6 text-left flex items-center justify-between ${gapClass} transition-colors cursor-pointer ${
                          String(opt.value) === String(value)
                            ? 'bg-slate-50 dark:bg-slate-800/40 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className={`flex items-center ${gapClass} flex-1 min-w-0`}>
                          {opt.icon && (
                            <Icon name={opt.icon} className="text-base flex-shrink-0" />
                          )}
                          <OverflowMarquee className="flex-1 min-w-0 text-left">{opt.label}</OverflowMarquee>
                        </div>
                        {opt.count !== undefined && opt.count > 0 && (
                          <span className={`px-2 py-0.5 min-w-[1.25rem] h-4 flex items-center justify-center rounded-full text-[10px] font-black transition-colors flex-shrink-0 ${
                            String(opt.value) === String(value)
                              ? 'bg-[#006eff] text-white shadow-md shadow-blue-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {opt.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              }

              return (
                <button
                  key={groupOrOpt.value}
                  type="button"
                  onClick={() => {
                    onChange?.({ target: { value: groupOrOpt.value } });
                    setIsOpen(false);
                  }}
                  className={`w-full ${optionPaddingClass} text-left flex items-center justify-between ${gapClass} transition-colors cursor-pointer ${
                    String(groupOrOpt.value) === String(value)
                      ? 'bg-slate-50 dark:bg-slate-800/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`flex items-center ${gapClass} flex-1 min-w-0`}>
                    {groupOrOpt.icon && (
                      <Icon name={groupOrOpt.icon} className="text-base flex-shrink-0" />
                    )}
                    <OverflowMarquee className="flex-1 min-w-0 text-left">{groupOrOpt.label}</OverflowMarquee>
                  </div>
                  {groupOrOpt.count !== undefined && groupOrOpt.count > 0 && (
                    <span className={`px-2 py-0.5 min-w-[1.25rem] h-4 flex items-center justify-center rounded-full text-[10px] font-black transition-colors ${
                      String(groupOrOpt.value) === String(value)
                        ? 'bg-[#006eff] text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {groupOrOpt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
