import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface OptionItem {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | OptionItem)[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  error?: boolean;
  accentColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
  triggerClassName?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  searchable = false,
  disabled = false,
  error = false,
  accentColor = 'blue',
  className,
  triggerClassName,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to { label, value }
  const normalizedOptions: OptionItem[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected item
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [open, searchable]);

  // Lock background screen scrolling on mobile when dropdown is open
  useEffect(() => {
    if (!open) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Lock body and HTML scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Also temporarily lock background scrollable parents (such as page container)
    const scrollParents = document.querySelectorAll<HTMLElement>('.overflow-y-auto');
    const originalStyles: Array<{ el: HTMLElement; overflow: string }> = [];

    scrollParents.forEach((el) => {
      // Do not lock the dropdown's own list container
      if (!el.closest('[data-radix-popper-content-wrapper]')) {
        originalStyles.push({ el, overflow: el.style.overflowY });
        el.style.overflowY = 'hidden';
      }
    });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      originalStyles.forEach(({ el, overflow }) => {
        el.style.overflowY = overflow;
      });
    };
  }, [open]);

  // Accent color ring styling
  const accentStyles = {
    blue: 'focus:border-google-blue focus:ring-google-blue/30 data-[state=open]:border-google-blue data-[state=open]:ring-2 data-[state=open]:ring-google-blue/30',
    green: 'focus:border-google-green focus:ring-google-green/30 data-[state=open]:border-google-green data-[state=open]:ring-2 data-[state=open]:ring-google-green/30',
    yellow: 'focus:border-google-yellow focus:ring-google-yellow/30 data-[state=open]:border-google-yellow data-[state=open]:ring-2 data-[state=open]:ring-google-yellow/30',
    red: 'focus:border-google-red focus:ring-google-red/30 data-[state=open]:border-google-red data-[state=open]:ring-2 data-[state=open]:ring-google-red/30',
    purple: 'focus:border-purple-400 focus:ring-purple-400/30 data-[state=open]:border-purple-400 data-[state=open]:ring-2 data-[state=open]:ring-purple-400/30',
  };

  const selectedItemStyles = {
    blue: 'bg-google-blue/15 text-google-blue font-semibold',
    green: 'bg-google-green/15 text-google-green font-semibold',
    yellow: 'bg-google-yellow/15 text-google-yellow font-semibold',
    red: 'bg-google-red/15 text-google-red font-semibold',
    purple: 'bg-purple-500/15 text-purple-400 font-semibold',
  };

  const checkColorStyles = {
    blue: 'text-google-blue',
    green: 'text-google-green',
    yellow: 'text-google-yellow',
    red: 'text-google-red',
    purple: 'text-purple-400',
  };

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-background text-left text-sm font-sans flex items-center justify-between transition-all outline-none cursor-pointer select-none',
              error ? 'border-destructive ring-1 ring-destructive/30' : 'border-input',
              accentStyles[accentColor],
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
              triggerClassName
            )}
          >
            <span
              className={cn(
                'truncate pr-2 block',
                !selectedOption ? 'text-muted-foreground' : 'text-foreground font-medium'
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200',
                open && 'transform rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="p-0 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden flex flex-col"
          style={{
            width: 'var(--radix-popover-trigger-width)',
            minWidth: '260px',
            maxWidth: 'calc(100vw - 24px)',
          }}
        >
          {/* Optional Search Box */}
          {searchable && (
            <div className="p-2 border-b border-border/80 flex items-center gap-2 bg-muted/40 shrink-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-muted-foreground hover:text-foreground rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Options List */}
          <div
            ref={listRef}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="overflow-y-auto max-h-60 sm:max-h-72 p-1.5 space-y-0.5 overscroll-contain touch-pan-y"
            style={{
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm font-sans flex items-center justify-between transition-colors cursor-pointer group select-none',
                      isSelected
                        ? selectedItemStyles[accentColor]
                        : 'text-foreground hover:bg-muted active:bg-muted/80'
                    )}
                  >
                    <span className="truncate pr-2 font-normal">{opt.label}</span>
                    {isSelected && (
                      <Check className={cn('w-4 h-4 shrink-0', checkColorStyles[accentColor])} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
