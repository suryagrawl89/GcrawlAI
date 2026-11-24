import React, { useEffect, useRef, useState, useMemo, type KeyboardEvent } from "react";
import { FiX, FiCheck, FiLoader, FiMapPin, FiGlobe } from "react-icons/fi";
import {
  searchFreeAirports,
  getFreeAirportByCode,
  matchesAirportQuery,
  sortAirportsByRelevance,
  type AirportOption,
  DEFAULT_MAJOR_AIRPORTS,
} from "../../utils/airportApi";

export interface AirportSelectInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const AirportSelectInput: React.FC<AirportSelectInputProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  style,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value || "");
  const [airports, setAirports] = useState<AirportOption[]>(DEFAULT_MAJOR_AIRPORTS);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedAirportDetail, setSelectedAirportDetail] = useState<AirportOption | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    const cleanVal = (value || "").trim().toUpperCase();
    if (!isTypingRef.current && cleanVal !== query.trim().toUpperCase()) {
      setQuery(cleanVal);
    }

    if (cleanVal) {
      const match = airports.find(
        (a) =>
          a.code.toUpperCase() === cleanVal ||
          (a.iata && a.iata.toUpperCase() === cleanVal) ||
          (a.icao && a.icao.toUpperCase() === cleanVal)
      );
      if (match) {
        setSelectedAirportDetail(match);
      } else {
        getFreeAirportByCode(cleanVal).then((res) => {
          if (res) {
            setSelectedAirportDetail(res);
          }
        });
      }
    } else {
      setSelectedAirportDetail(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        isTypingRef.current = false;
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const performSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) {
      setAirports(DEFAULT_MAJOR_AIRPORTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = await searchFreeAirports(term, 25);
      setAirports(results || []);

      const upperTerm = term.toUpperCase();
      const exactMatch = (results || []).find(
        (r) =>
          r.code.toUpperCase() === upperTerm ||
          (r.iata && r.iata.toUpperCase() === upperTerm) ||
          (r.icao && r.icao.toUpperCase() === upperTerm)
      );
      if (exactMatch) {
        setSelectedAirportDetail(exactMatch);
      }
    } catch (err) {
      console.warn("FreeAirportDB search failed:", err);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    isTypingRef.current = true;
    setQuery(text);
    setIsOpen(true);
    setHighlightedIndex(0);

    const cleanCode = text.trim().toUpperCase();
    onChange(cleanCode);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (text.trim().length >= 1) {
      searchDebounceRef.current = setTimeout(() => {
        performSearch(text.trim());
      }, 150);
    } else {
      setAirports(DEFAULT_MAJOR_AIRPORTS);
      setSelectedAirportDetail(null);
    }
  };

  const handleSelectAirport = (ap: AirportOption) => {
    isTypingRef.current = false;
    const selectedCode = (ap.iata || ap.code).toUpperCase();
    setQuery(selectedCode);
    setSelectedAirportDetail(ap);
    onChange(selectedCode);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    isTypingRef.current = false;
    setQuery("");
    setSelectedAirportDetail(null);
    onChange("");
    setIsOpen(false);
    setAirports(DEFAULT_MAJOR_AIRPORTS);
    inputRef.current?.focus();
  };

  const filteredAirports = useMemo(() => {
    const q = (query || "").trim();
    if (!q) {
      return airports;
    }
    const matched = airports.filter((a) => matchesAirportQuery(a, q));
    return sortAirportsByRelevance(matched, q);
  }, [airports, query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredAirports.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredAirports.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredAirports.length) {
        handleSelectAirport(filteredAirports[highlightedIndex]);
      } else if (filteredAirports.length > 0) {
        handleSelectAirport(filteredAirports[0]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    isTypingRef.current = false;
  };

  const currentCode = (value || query || "").trim().toUpperCase();
  const hasQuery = query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 max-w-full overflow-visible ${isOpen ? "z-[120]" : "z-0"}`}
      style={style}
    >
      <div className="relative flex items-center w-full min-w-0 max-w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          onFocus={(e) => {
            if (disabled) return;
            setIsOpen(true);
            e.target.select();
          }}
          onBlur={handleBlur}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Search by IATA, city, airport name..."}
          className={`w-full min-w-0 max-w-full box-border px-3.5 py-2.5 pr-14 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-[#0b5cad] focus:ring-2 focus:ring-[#0b5cad]/20 transition-all uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-normal disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5 text-slate-500 pointer-events-auto">
          {loading ? (
            <FiLoader className="w-3.5 h-3.5 animate-spin text-[#0b5cad]" />
          ) : query && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Clear"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-xs opacity-60">✈️</span>
          )}
        </div>
      </div>

      {selectedAirportDetail && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#0b5cad] font-medium w-full min-w-0 max-w-full overflow-hidden">
          <FiMapPin className="flex-shrink-0 w-3 h-3 text-[#0b5cad]" />
          <span className="truncate font-semibold flex-shrink-0 max-w-[45%]">
            {selectedAirportDetail.name}
          </span>
          <span className="opacity-75 truncate text-[10px] min-w-0 flex-1">
            • {[selectedAirportDetail.city, selectedAirportDetail.region_name, selectedAirportDetail.country].filter(Boolean).join(", ")}
            {selectedAirportDetail.continent_name ? ` (${selectedAirportDetail.continent_name})` : ""}
          </span>
        </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-2xl z-[9999] p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>{hasQuery ? `Results for "${query.trim()}"` : "Popular Global Hubs"}</span>
            {loading ? (
              <span className="text-[#0b5cad] animate-pulse text-[10px]">Searching airports...</span>
            ) : (
              <span className="text-[10px] opacity-70">{filteredAirports.length} found</span>
            )}
          </div>

          {filteredAirports.length === 0 ? (
            <div className="p-4 text-xs text-center text-slate-500">
              {loading ? (
                <div className="flex items-center justify-center gap-2 text-[#0b5cad]">
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Searching for &quot;{query}&quot;...</span>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600">
                    No airport found matching &quot;<strong>{query}</strong>&quot;.
                  </p>
                  <p className="text-[10px] mt-1 opacity-70">
                    You can still use code <strong>{query.toUpperCase()}</strong> directly.
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredAirports.map((ap, idx) => {
              const itemCode = (ap.iata || ap.code).toUpperCase();
              const isSelected = itemCode === currentCode;
              const isHighlighted = idx === highlightedIndex;
              const isExactMatch =
                itemCode === query.trim().toUpperCase() ||
                (ap.icao && ap.icao.toUpperCase() === query.trim().toUpperCase());

              const locationParts = [
                ap.municipality || ap.city,
                ap.region_name || ap.region_code,
                ap.country_name || ap.country,
              ].filter(Boolean);

              return (
                <button
                  key={`${itemCode}-${ap.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectAirport(ap)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer mb-1 ${
                    isSelected || isExactMatch
                      ? "bg-blue-50 text-[#0b5cad] font-semibold border border-[#0b5cad]/30 shadow-xs"
                      : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 text-slate-900"
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-900 truncate">{ap.name}</span>
                      {(isSelected || isExactMatch) && <FiCheck className="w-3 h-3 text-[#0b5cad] flex-shrink-0" />}
                      {isExactMatch && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#0b5cad] text-white rounded font-sans uppercase font-bold tracking-tight">
                          Exact Match
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                      <span className="truncate">{locationParts.join(", ")}</span>
                      {ap.continent_name && (
                        <span className="opacity-75 flex-shrink-0 flex items-center gap-0.5">
                          • <FiGlobe className="w-2.5 h-2.5 inline opacity-60" /> {ap.continent_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0b5cad]/10 text-[#0b5cad] border border-[#0b5cad]/20 shadow-xs">
                      {itemCode}
                    </span>
                    {ap.icao && ap.icao !== itemCode && (
                      <span className="text-[9px] font-mono text-slate-400">
                        ICAO: {ap.icao}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AirportSelectInput;
