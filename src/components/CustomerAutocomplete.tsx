import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  Search,
  Check,
  ChevronDown,
  X,
  MapPin,
  Phone,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Customer } from '../types';

interface CustomerAutocompleteProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  customers: Customer[];
  placeholder?: string;
  accentColor?: 'blue' | 'emerald';
  helpText?: string;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  id,
  label,
  required = false,
  value,
  onChange,
  onSelectCustomer,
  customers,
  placeholder = 'Type starting letters to search...',
  accentColor = 'blue',
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [lastSelectedCustomerName, setLastSelectedCustomerName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isEmerald = accentColor === 'emerald';
  const focusBorderClass = isEmerald
    ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
    : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
  const badgeClass = isEmerald
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  const highlightItemBg = isEmerald ? 'bg-emerald-50/80' : 'bg-blue-50/80';
  const highlightTextColor = isEmerald ? 'text-emerald-700' : 'text-blue-700';

  // Smart matching logic:
  // 1. Starts with query (case-insensitive) - Top priority
  // 2. Any word in the company name starts with query
  // 3. Substring match in name, gstin, address, or phone
  const filteredCustomers = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return customers;
    }

    const startsWithMatches: Customer[] = [];
    const wordStartsMatches: Customer[] = [];
    const containsMatches: Customer[] = [];

    customers.forEach((c) => {
      const nameLower = c.name.toLowerCase();
      const gstinLower = (c.gstin || '').toLowerCase();
      const addressLower = (c.address || '').toLowerCase();
      const contactLower = (c.contact || '').toLowerCase();

      if (nameLower.startsWith(trimmed)) {
        startsWithMatches.push(c);
      } else {
        const words = nameLower.split(/[\s-]+/);
        const hasWordStart = words.some((w) => w.startsWith(trimmed));
        if (hasWordStart) {
          wordStartsMatches.push(c);
        } else if (
          nameLower.includes(trimmed) ||
          gstinLower.includes(trimmed) ||
          addressLower.includes(trimmed) ||
          contactLower.includes(trimmed)
        ) {
          containsMatches.push(c);
        }
      }
    });

    return [...startsWithMatches, ...wordStartsMatches, ...containsMatches];
  }, [customers, value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(filteredCustomers.length > 0 ? 0 : -1);
  }, [filteredCustomers.length]);

  // Ensure highlighted element is visible in scroll area
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (customer: Customer) => {
    onChange(customer.name);
    onSelectCustomer(customer);
    setLastSelectedCustomerName(customer.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
          e.preventDefault();
          handleSelect(filteredCustomers[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex] && value.trim().length > 0) {
          handleSelect(filteredCustomers[highlightedIndex]);
        } else {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  // Helper to render matched highlight
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span>{text}</span>;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);

    return (
      <span>
        {before}
        <span className={`font-black underline decoration-2 ${highlightTextColor} bg-amber-100 px-0.5 rounded-xs`}>
          {match}
        </span>
        {after}
      </span>
    );
  };

  const isMatchedWithMaster =
    lastSelectedCustomerName &&
    lastSelectedCustomerName.toLowerCase() === value.trim().toLowerCase();

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {isMatchedWithMaster && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}
          >
            <Check className="w-3 h-3" />
            <span>Master Linked</span>
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Building2 className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-16 py-2 text-slate-900 text-xs font-medium transition-all ${focusBorderClass} focus:bg-white`}
        />

        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange('');
                setLastSelectedCustomerName(null);
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
            title="Browse Master Customer List"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {helpText && !isOpen && (
        <p className="text-[10px] text-slate-400 mt-1">{helpText}</p>
      )}

      {/* Floating Suggestions Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {value.trim()
                  ? `Matching Customers (${filteredCustomers.length})`
                  : `Customer Master Directory (${customers.length})`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Type letters or press <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[9px]">↓</kbd> / <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[9px]">↵</kbd>
            </span>
          </div>

          {/* List of matching customers */}
          {filteredCustomers.length > 0 ? (
            <ul ref={listRef} className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredCustomers.map((cust, idx) => {
                const isSelected = idx === highlightedIndex;
                return (
                  <li
                    key={cust.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(cust)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? highlightItemBg : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Company Name */}
                        <div className="font-bold text-slate-900 text-xs sm:text-[13px] flex items-center gap-1.5 flex-wrap">
                          {renderHighlightedText(cust.name, value)}
                          {cust.pan && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              PAN: {cust.pan}
                            </span>
                          )}
                        </div>

                        {/* GSTIN & Phone */}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600 flex-wrap">
                          {cust.gstin && (
                            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-500" />
                              {cust.gstin}
                            </span>
                          )}
                          {cust.contact && (
                            <span className="flex items-center gap-1 text-slate-600 text-[10px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {cust.contact}
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        {cust.address && (
                          <div className="flex items-start gap-1 mt-1 text-[10px] text-slate-500 line-clamp-1">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>{cust.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-opacity ${
                            isSelected
                              ? 'bg-blue-600 text-white opacity-100'
                              : 'bg-slate-100 text-slate-600 opacity-60'
                          }`}
                        >
                          Auto-fill
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center space-y-1.5">
              <p className="text-slate-600 font-semibold text-xs">
                No customer starting with "{value}" in Master.
              </p>
              <p className="text-[11px] text-slate-500">
                You can continue typing this new customer name freely, or add it to Master Data later.
              </p>
            </div>
          )}

          {/* Footer with hint */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Selecting automatically fills GSTIN, Mobile & Address</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
