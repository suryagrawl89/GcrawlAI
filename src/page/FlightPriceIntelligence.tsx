import { useState, useMemo, useEffect, useRef } from "react";
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiInfo,
  FiPlay,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import SEO from "../components/common/SEO";
import AirportSelectInput from "../components/common/AirportSelectInput";
import { fetchGoogleFlights } from "../services/flightApi";
import "./FlightPriceIntelligence.css";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface FlightItem {
  airline: string;
  flight_number?: string;
  no: string;
  departure_time: string;
  arrival_time?: string;
  arrival_date?: string;
  dep: number; // minutes from midnight
  price: string | number;
  p: number; // numeric price in INR
  stops: string;
  duration?: string;
  a: {
    n: string;
    c: string;
    col: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const getAirMeta = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const col = `hsl(${Math.abs(hash) % 360}, 75%, 38%)`;
  const words = name.trim().split(" ");
  const c =
    words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  return { n: name, c, col };
};

const rupee = (val: number) => "₹" + Math.round(val).toLocaleString("en-IN");

const fmtMinutes = (m: number) => {
  const norm = ((m % 1440) + 1440) % 1440;
  const hrs = String(Math.floor(norm / 60)).padStart(2, "0");
  const mins = String(norm % 60).padStart(2, "0");
  return `${hrs}:${mins}`;
};

const parseTimeString = (t: string): number => {
  if (!t) return 0;
  const str = t.trim();
  if (str.includes("AM") || str.includes("PM") || str.includes("am") || str.includes("pm")) {
    const parts = str.split(/\s+/);
    const timeParts = parts[0].split(":");
    let h = parseInt(timeParts[0], 10) || 0;
    const m = parseInt(timeParts[1], 10) || 0;
    const ampm = (parts[1] || "").toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  const parts = str.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const parsePriceNumber = (p: any): number | null => {
  if (typeof p === "number") return p;
  if (!p) return null;
  const cleaned = String(p).replace(/[^0-9]/g, "");
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? null : val;
};

const formatDateIso = (d: Date): string => {
  const z = new Date(d);
  z.setMinutes(z.getMinutes() - z.getTimezoneOffset());
  return z.toISOString().slice(0, 10);
};

const getArrivalDateString = (
  depDate: Date,
  arrTimeStr?: string,
  rawArrDate?: string,
  depMinutes?: number
): string => {
  if (rawArrDate && typeof rawArrDate === "string" && rawArrDate.trim()) {
    const parsedDate = new Date(rawArrDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    }
    return rawArrDate.trim();
  }

  const d = new Date(depDate);
  if (arrTimeStr) {
    const plusMatch = arrTimeStr.match(/\+(\d+)/);
    if (plusMatch && plusMatch[1]) {
      const daysToAdd = parseInt(plusMatch[1], 10) || 1;
      d.setDate(d.getDate() + daysToAdd);
    } else if (arrTimeStr.toLowerCase().includes("next day")) {
      d.setDate(d.getDate() + 1);
    } else if (depMinutes !== undefined) {
      const arrMinutes = parseTimeString(arrTimeStr);
      if (arrMinutes > 0 && arrMinutes < depMinutes) {
        d.setDate(d.getDate() + 1);
      }
    }
  }

  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

/* -------------------------------------------------------------------------- */
/*               MODERN EXTRACTOR-STYLED DATE PICKER                          */
/* -------------------------------------------------------------------------- */

function CustomModernDatePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Date;
  onChange: (d: Date) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewYear, setViewYear] = useState(() => value.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value.getMonth());

  useEffect(() => {
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const formattedDisplay = useMemo(() => {
    try {
      return value.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return formatDateIso(value);
    }
  }, [value]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    const nextDate = new Date(viewYear, viewMonth, day, 12, 0, 0);
    onChange(nextDate);
    setIsOpen(false);
  };

  const setPresetDays = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    d.setHours(12, 0, 0, 0);
    onChange(d);
    setIsOpen(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div ref={containerRef} className={`fpi-modern-date-wrapper ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`fpi-modern-date-trigger ${disabled ? "disabled" : ""}`}
      >
        <span className="fpi-date-label-content">
          <FiCalendar className="fpi-date-icon" />
          <span className="fpi-date-text">{formattedDisplay}</span>
        </span>
        <FiChevronDown className={`fpi-date-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="fpi-modern-date-popover">
          <div className="fpi-date-presets">
            <button
              type="button"
              onClick={() => setPresetDays(0)}
              className="fpi-preset-btn"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(1)}
              className="fpi-preset-btn"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(10)}
              className="fpi-preset-btn"
            >
              +10 Days
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(20)}
              className="fpi-preset-btn"
            >
              +20 Days
            </button>
            <button
              type="button"
              onClick={() => setPresetDays(30)}
              className="fpi-preset-btn"
            >
              +1 Month
            </button>
          </div>

          <div className="fpi-date-month-nav">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="fpi-month-arrow"
              title="Previous month"
            >
              ‹
            </button>
            <span className="fpi-month-title">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="fpi-month-arrow"
              title="Next month"
            >
              ›
            </button>
          </div>

          <div className="fpi-date-weekdays">
            {daysOfWeek.map((day) => (
              <span key={day} className="fpi-weekday-cell">
                {day}
              </span>
            ))}
          </div>

          <div className="fpi-date-days-grid">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="fpi-day-cell empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(viewYear, viewMonth, dayNum);
              cellDate.setHours(0, 0, 0, 0);
              const isPast = cellDate < today;
              const isSelected =
                cellDate.toDateString() === new Date(value).toDateString();

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isPast}
                  onClick={() => !isPast && selectDate(dayNum)}
                  className={`fpi-day-cell ${isSelected ? "selected" : ""} ${
                    isPast ? "disabled" : ""
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*               MODERN EXTRACTOR-STYLED VIEW ALL SELECT                      */
/* -------------------------------------------------------------------------- */

function ViewAllSelectInput({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`fpi-viewall-container ${disabled ? "is-disabled" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(false)}
        className={`fpi-viewall-btn ${!value ? "is-active" : ""}`}
      >
        <span className="fpi-viewall-icon">⭐</span>
        <span>Top Flights</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(true)}
        className={`fpi-viewall-btn ${value ? "is-active" : ""}`}
      >
        <span className="fpi-viewall-icon">✈️</span>
        <span>All Flights</span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*               MODERN EXTRACTOR-STYLED AIRLINE SELECT                       */
/* -------------------------------------------------------------------------- */

function ModernAirlineSelect({
  value,
  options,
  flights,
  onChange,
  disabled = false,
}: {
  value: string;
  options: string[];
  flights: FlightItem[];
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [search, options]);

  const selectedMeta = value ? getAirMeta(value) : null;

  return (
    <div ref={containerRef} className={`fpi-airline-select-wrapper ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`fpi-airline-select-trigger ${disabled ? "disabled" : ""}`}
      >
        <div className="fpi-airline-trigger-content">
          {selectedMeta ? (
            <>
              <span
                className="fpi-airline-badge-avatar"
                style={{ background: selectedMeta.col }}
              >
                {selectedMeta.c}
              </span>
              <span className="fpi-airline-selected-name">{value}</span>
            </>
          ) : (
            <span className="fpi-airline-placeholder">Select Your Airline...</span>
          )}
        </div>
        <FiChevronDown className={`fpi-airline-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="fpi-airline-dropdown-menu">
          {options.length > 4 && (
            <div className="fpi-airline-search-bar">
              <FiSearch className="fpi-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter airlines..."
                className="fpi-airline-search-input"
              />
            </div>
          )}

          <div className="fpi-airline-options-list">
            {filteredOptions.length === 0 ? (
              <div className="fpi-airline-no-options">No matching airlines</div>
            ) : (
              filteredOptions.map((air) => {
                const meta = getAirMeta(air);
                const isSelected = air === value;
                const flightCount = flights.filter((f) => f.a.n === air).length;

                return (
                  <button
                    key={air}
                    type="button"
                    onClick={() => {
                      onChange(air);
                      setIsOpen(false);
                    }}
                    className={`fpi-airline-option-btn ${isSelected ? "selected" : ""}`}
                  >
                    <div className="fpi-airline-option-left">
                      <span
                        className="fpi-airline-badge-avatar"
                        style={{ background: meta.col }}
                      >
                        {meta.c}
                      </span>
                      <div className="fpi-airline-option-text">
                        <span className="fpi-airline-option-title">{air}</span>
                        <span className="fpi-airline-option-count">
                          {flightCount} {flightCount === 1 ? "departure" : "departures"}
                        </span>
                      </div>
                    </div>
                    {isSelected && <FiCheck className="fpi-airline-check-icon" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*               MODERN EXTRACTOR-STYLED HOURS SELECT                         */
/* -------------------------------------------------------------------------- */

function ModernHoursSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const hourOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div ref={containerRef} className={`fpi-hours-select-container ${isOpen ? "is-open" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`fpi-hours-select-trigger ${disabled ? "disabled" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="fpi-hours-trigger-content">
          <FiClock className="fpi-hours-icon" />
          <span className="fpi-hours-selected-text">
            {value} Hour{value > 1 ? "s" : ""} Window (±{value}h)
          </span>
        </div>
        <FiChevronDown className={`fpi-hours-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="fpi-hours-dropdown-menu" role="listbox">
          {hourOptions.map((hr) => {
            const isSelected = hr === value;
            return (
              <button
                key={hr}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(hr);
                  setIsOpen(false);
                }}
                className={`fpi-hours-option-btn ${isSelected ? "selected" : ""}`}
              >
                <span className="fpi-hours-option-label">
                  <strong>{hr} {hr === 1 ? "Hour" : "Hours"}</strong>
                  <small>±{hr}h proximity window</small>
                </span>
                {isSelected && <FiCheck className="fpi-hours-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SEO SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const flightIntelligenceSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gramosoft.com/#organization",
      "name": "Gramosoft Private Limited",
      "url": "https://gramosoft.com/",
      "email": "rajeshm@gramosoft.in",
      "foundingDate": "2022",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN",
      },
      "description":
        "Chennai-based deep-tech company building AI products for aviation, automotive, insurance and enterprise data intelligence.",
    },
    {
      "@type": "WebPage",
      "@id": "https://gcrawlai.com/flight-price-intelligence#webpage",
      "url": "https://gcrawlai.com/flight-price-intelligence",
      "name": "Flight Price Intelligence Software for Airlines",
      "inLanguage": "en-IN",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://gcrawlai.com/flight-price-intelligence#software",
      "name": "Flight Price Intelligence",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "Airline pricing and revenue management",
      "operatingSystem": "Web browser",
      "description":
        "Web dashboard that compares an airline's fares with competitor flights departing within 1 to 10 hours before and after each of its flights, using fare data collected in real time.",
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Free demo and API evaluation on request",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function FlightPriceIntelligence() {
  const [origin, setOrigin] = useState("MAA");
  const [destination, setDestination] = useState("DXB");
  const [viewAll, setViewAll] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d;
  });

  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMyAirline, setSelectedMyAirline] = useState<string>("");
  const [checkedFlightNos, setCheckedFlightNos] = useState<string[]>([]);
  const [checkedCompetitors, setCheckedCompetitors] = useState<string[]>([]);
  const [windowHours, setWindowHours] = useState<number>(3);

  const executeSearch = async (
    orig = origin,
    dest = destination,
    dateObj = selectedDate,
    isViewAll = viewAll
  ) => {
    const cleanOrig = (orig || "").trim().toUpperCase();
    const cleanDest = (dest || "").trim().toUpperCase();

    if (!cleanOrig || !cleanDest) {
      toast.error("Please provide both Origin and Destination airport codes (e.g. MAA to DXB)");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    const dateStr = formatDateIso(dateObj);

    try {
      const res = await fetchGoogleFlights({
        trip_type: "oneway",
        origin: cleanOrig,
        destination: cleanDest,
        outbound_date: dateStr,
        proxy_geo: "IN",
        full_flight: isViewAll,
      });

      if (res && res.status === "success" && Array.isArray(res.flights) && res.flights.length > 0) {
        const parsed: FlightItem[] = res.flights
          .map((f: any, i: number) => {
            const numericPrice = parsePriceNumber(f.price);
            const airlineName = f.airline || "Airline";
            const depMinutes = parseTimeString(f.departure_time || "12:00");
            const fNo =
              f.flight_number ||
              airlineName.substring(0, 2).toUpperCase() + " " + (100 + i);
            const rawArrTime = (f.arrival_time || f.arrival || f.arr_time || "").trim();
            const rawArrDate = f.arrival_date || f.arr_date || f.arrivalDate;
            const arrDateStr = getArrivalDateString(dateObj, rawArrTime, rawArrDate, depMinutes);

            return {
              airline: airlineName,
              flight_number: fNo,
              no: fNo,
              departure_time: f.departure_time || "12:00",
              arrival_time: rawArrTime || "—",
              arrival_date: arrDateStr,
              dep: depMinutes,
              price: f.price,
              p: numericPrice || 0,
              stops: f.stops || "Non-stop",
              duration: f.duration || "—",
              a: getAirMeta(airlineName),
            };
          })
          .filter((f: FlightItem) => f.p > 0);

        if (parsed.length > 0) {
          setFlights(parsed);

          const airlines = Array.from(new Set(parsed.map((f) => f.a.n)));
          setSelectedMyAirline(airlines[0]);
          const firstAirFlights = parsed.filter((f) => f.a.n === airlines[0]);
          setCheckedFlightNos(firstAirFlights.map((f) => f.no));
          const otherAirlines = airlines.filter((a) => a !== airlines[0]);
          setCheckedCompetitors(otherAirlines);

          toast.success(`Retrieved ${parsed.length} competitor flights for ${cleanOrig} → ${cleanDest}`);
          return;
        }
      }

      setFlights([]);
      setSelectedMyAirline("");
      setCheckedFlightNos([]);
      setCheckedCompetitors([]);
      if (res) {
        toast.error(`No flight records found for ${cleanOrig} → ${cleanDest} on ${dateStr}`);
      }
    } catch (err: any) {
      setFlights([]);
      setSelectedMyAirline("");
      setCheckedFlightNos([]);
      setCheckedCompetitors([]);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to query flight data.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const availableAirlines = useMemo(() => {
    return Array.from(new Set(flights.map((f) => f.a.n)));
  }, [flights]);

  const myAirlineFlights = useMemo(() => {
    if (!selectedMyAirline) return [];
    return flights.filter((f) => f.a.n === selectedMyAirline);
  }, [flights, selectedMyAirline]);

  const competitorAirlines = useMemo(() => {
    return availableAirlines.filter((a) => a !== selectedMyAirline);
  }, [availableAirlines, selectedMyAirline]);

  const handleMyAirlineChange = (airName: string) => {
    setSelectedMyAirline(airName);
    const flightsForAir = flights.filter((f) => f.a.n === airName);
    setCheckedFlightNos(flightsForAir.map((f) => f.no));

    const rivals = availableAirlines.filter((a) => a !== airName);
    setCheckedCompetitors(rivals);
  };

  const toggleFlightSelection = (flightNo: string) => {
    setCheckedFlightNos((prev) =>
      prev.includes(flightNo) ? prev.filter((x) => x !== flightNo) : [...prev, flightNo]
    );
  };

  const toggleCompetitorSelection = (compName: string) => {
    setCheckedCompetitors((prev) =>
      prev.includes(compName) ? prev.filter((x) => x !== compName) : [...prev, compName]
    );
  };

  const dateStrip = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      const isPast = d < today;
      const isSelected = d.toDateString() === selectedDate.toDateString();
      arr.push({ date: d, isPast, isSelected });
    }
    return arr;
  }, [selectedDate]);

  const handleDateShift = (days: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (nextDate >= today) {
      setSelectedDate(nextDate);
      executeSearch(origin, destination, nextDate);
    }
  };

  const comparisons = useMemo(() => {
    const mySelected = myAirlineFlights.filter((f) => checkedFlightNos.includes(f.no));
    const competitorFlights = flights.filter((f) => checkedCompetitors.includes(f.a.n));

    return mySelected.map((myFlight) => {
      const myDep = myFlight.dep;
      const myPrice = myFlight.p;
      const windowMinutes = windowHours * 60;

      const nearCompetitors = competitorFlights.filter((f) => {
        let diff = Math.abs(f.dep - myDep);
        if (diff > 1440 - windowMinutes) diff = 1440 - diff;
        return diff <= windowMinutes;
      });

      const beforeList = nearCompetitors
        .filter((f) => {
          let diff = myDep - f.dep;
          if (diff < -720) diff += 1440;
          return diff > 0 && diff <= windowMinutes;
        })
        .sort((a, b) => a.dep - b.dep);

      const afterList = nearCompetitors
        .filter((f) => {
          let diff = f.dep - myDep;
          if (diff < -720) diff += 1440;
          return diff >= 0 && diff <= windowMinutes;
        })
        .sort((a, b) => a.dep - b.dep);

      const cheaperCount = nearCompetitors.filter((f) => f.p < myPrice).length;

      return {
        myFlight,
        nearCompetitors,
        beforeList,
        afterList,
        cheaperCount,
        totalNear: nearCompetitors.length,
      };
    });
  }, [myAirlineFlights, checkedFlightNos, flights, checkedCompetitors, windowHours]);

  return (
    <div className="fpi-page-wrapper">
      <SEO
        title="Flight Price Intelligence Software for Airlines & OTAs"
        description="Compare your airline's fares with competitor flights departing 1 to 10 hours before and after yours in real time. Route benchmarking & OTA parity analytics."
        keywords="flight price intelligence, airfare monitoring, competitor fare tracking, airline pricing tool, airline revenue management, fare comparison, OTA rate parity"
        schema={flightIntelligenceSchema}
      />

      <Navbar />

      <main id="main-content" className="fpi-main">
        <div className="fpi-container">
          <nav className="fpi-crumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <a href="#">Home</a>
              </li>
              <li aria-current="page">Flight Price Intelligence</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <section className="fpi-hero" aria-labelledby="fpi-hero-title">
            <div className="fpi-hero-left">
              <span className="fpi-badge">✈️ Revenue Management & Pricing Intelligence</span>
              <h1 id="fpi-hero-title">
                Flight Price Intelligence <span>for Airlines & OTAs</span>
              </h1>
              <p className="fpi-hero-lead">
                Benchmark your fares against competing flights within a flexible departure-time window. Identify pricing gaps, monitor OTA rate parity, and make smarter revenue management decisions with real-time insights in one unified view.
              </p>
              <div className="fpi-hero-actions">
                <a href="#live-demo" className="fpi-btn fpi-btn-primary">
                  <FiPlay style={{ marginRight: 6 }} /> Try Price Check
                </a>
                <a
                  href="mailto:rajeshm@gramosoft.in?subject=Flight%20Price%20Intelligence%20Inquiry"
                  className="fpi-btn fpi-btn-ghost"
                >
                  Contact Solutions Team
                </a>
              </div>
            </div>

            {/* Visual Hero Preview Badge */}
            <div className="fpi-hero-preview">
              <div className="fpi-preview-card">
                <div className="fpi-pv-top">
                  <div>
                    <small>Sample Benchmark</small>
                    <strong>6E 544</strong>
                  </div>
                  <div>
                    <small>Departs</small>
                    <strong>13:15</strong>
                  </div>
                  <div>
                    <small>Price</small>
                    <strong className="fpi-price-highlight">₹13,528</strong>
                  </div>
                  <span className="fpi-verdict-pill fpi-verdict-alert">
                    2 of 4 competitors cheaper
                  </span>
                </div>
                <div className="fpi-pv-grid">
                  <div className="fpi-pv-col">
                    <h3>3 Hours Before</h3>
                    <div className="fpi-pv-item">
                      <div>
                        <b>Emirates</b>
                        <span>EK 492 · 10:50 · Non-stop</span>
                      </div>
                      <div className="fpi-pv-right">
                        <b>₹10,908</b>
                        <span className="fpi-tag fpi-tag-cheap">₹2,620 cheaper</span>
                      </div>
                    </div>
                    <div className="fpi-pv-item">
                      <div>
                        <b>Air India</b>
                        <span>AI 242 · 11:30 · 1 stop</span>
                      </div>
                      <div className="fpi-pv-right">
                        <b>₹13,758</b>
                        <span className="fpi-tag fpi-tag-dear">₹230 higher</span>
                      </div>
                    </div>
                  </div>
                  <div className="fpi-pv-col">
                    <h3>3 Hours After</h3>
                    <div className="fpi-pv-item">
                      <div>
                        <b>Air Arabia</b>
                        <span>G9 239 · 14:30 · Non-stop</span>
                      </div>
                      <div className="fpi-pv-right">
                        <b>₹11,548</b>
                        <span className="fpi-tag fpi-tag-cheap">₹1,980 cheaper</span>
                      </div>
                    </div>
                    <div className="fpi-pv-item">
                      <div>
                        <b>flydubai</b>
                        <span>FZ 318 · 15:45 · Non-stop</span>
                      </div>
                      <div className="fpi-pv-right">
                        <b>₹14,210</b>
                        <span className="fpi-tag fpi-tag-dear">₹682 higher</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Interactive Live Demo Tool */}
        <section className="fpi-tool-section" id="live-demo" aria-labelledby="fpi-tool-title">
          <div className="fpi-container">
            <div className="fpi-section-header">
              <h2 id="fpi-tool-title">Interactive Flight Price Check</h2>
              <p className="fpi-section-subtitle">
                Select origin and destination airports and travel date, then run live extraction to
                generate dynamic proximity comparison matrices.
              </p>
            </div>

            <div className="fpi-tool-container">
              {/* Step 1: Select Route and Date */}
              <div className="fpi-card">
                <div className="fpi-card-step">
                  <span className="fpi-step-num">1</span>
                  <span>Select Route & Travel Date</span>
                </div>
                <div className="fpi-step1-grid">
                  <div className="fpi-form-group">
                    <label>From (Origin Airport)</label>
                    <AirportSelectInput
                      value={origin}
                      onChange={(val) => setOrigin(val)}
                      placeholder="Search origin airport (e.g. MAA, Chennai)..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="fpi-form-group">
                    <label>To (Destination Airport)</label>
                    <AirportSelectInput
                      value={destination}
                      onChange={(val) => setDestination(val)}
                      placeholder="Search destination airport (e.g. DXB, Dubai)..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="fpi-form-group">
                    <label>Departure Date</label>
                    <CustomModernDatePicker
                      value={selectedDate}
                      onChange={(d) => setSelectedDate(d)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="fpi-form-group">
                    <label>View All Flights</label>
                    <ViewAllSelectInput
                      value={viewAll}
                      onChange={(val) => setViewAll(val)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="fpi-step1-actions">
                  <button
                    type="button"
                    onClick={() => executeSearch(origin, destination, selectedDate, viewAll)}
                    disabled={isLoading || !origin.trim() || !destination.trim()}
                    className="fpi-btn fpi-btn-primary fpi-fetch-btn"
                  >
                    {isLoading ? (
                      <>
                        <span className="fpi-spinner"></span> Extracting Fares...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw style={{ marginRight: 6 }} /> Check Prices
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extraction Loader State */}
              {isLoading && (
                <div className="fpi-card fpi-loading-card">
                  <div className="fpi-loading-content">
                    <span className="fpi-large-spinner"></span>
                    <h3>Extracting live airfares for {origin} → {destination}...</h3>
                    <p>Connecting to flight data engine with proxy rotation & anti-bot bypass.</p>
                  </div>
                </div>
              )}

              {/* Empty Feedback State */}
              {!isLoading && hasSearched && flights.length === 0 && (
                <div className="fpi-card fpi-empty-card">
                  <div className="fpi-empty-icon">✈️</div>
                  <h3>No Flight Records Found</h3>
                  <p>
                    No active flights found for <strong>{origin} → {destination}</strong> on {formatDateIso(selectedDate)}.
                    Please try another travel date or corridor (e.g. MAA → DXB, DEL → BOM, BLR → SIN).
                  </p>
                </div>
              )}

              {/* Steps 2-5 shown when flights are available */}
              {!isLoading && flights.length > 0 && (
                <>
                  {/* Step 2: Choose Your Flights */}
                  <div className="fpi-card">
                    <div className="fpi-card-step">
                      <span className="fpi-step-num">2</span>
                      <span>Choose Your Flights on this Route</span>
                    </div>

                    <div className="fpi-airline-control-header">
                      <div className="fpi-airline-select-row">
                        <label className="fpi-inline-label">Your Airline:</label>
                        <ModernAirlineSelect
                          value={selectedMyAirline}
                          options={availableAirlines}
                          flights={flights}
                          onChange={handleMyAirlineChange}
                        />
                      </div>

                      {myAirlineFlights.length > 1 && (
                        <div className="fpi-quick-actions">
                          <button
                            type="button"
                            onClick={() => setCheckedFlightNos(myAirlineFlights.map((f) => f.no))}
                            className="fpi-quick-btn"
                          >
                            Select All ({myAirlineFlights.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckedFlightNos([])}
                            className="fpi-quick-btn"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="fpi-card-sub">
                      Select the specific departures of <strong>{selectedMyAirline}</strong> you want to benchmark:
                    </p>

                    <div className="fpi-pills-row">
                      {myAirlineFlights.map((f) => {
                        const isChecked = checkedFlightNos.includes(f.no);
                        return (
                          <button
                            key={f.no}
                            type="button"
                            role="checkbox"
                            aria-checked={isChecked}
                            className={`fpi-pill ${isChecked ? "active" : ""}`}
                            onClick={() => toggleFlightSelection(f.no)}
                          >
                            <span className={`fpi-checkbox-box ${isChecked ? "checked" : ""}`}>
                              {isChecked && <FiCheck className="fpi-checkbox-check" />}
                            </span>
                            <span className="fpi-pill-avatar" style={{ background: f.a.col }}>
                              {f.a.c}
                            </span>
                            <div className="fpi-pill-body">
                              <strong>{f.no}</strong>
                              <small>
                                departs {fmtMinutes(f.dep)} · arrives {f.arrival_time} · {rupee(f.p)}
                              </small>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Choose Competitors */}
                  <div className="fpi-card">
                    <div className="fpi-card-step">
                      <span className="fpi-step-num">3</span>
                      <span>Choose Competitor Airlines to Compare</span>
                    </div>

                    {competitorAirlines.length === 0 ? (
                      <div className="fpi-empty-prompt">
                        <FiInfo style={{ marginRight: 6 }} />
                        <span>No competitor airlines found operating on this route for the selected date.</span>
                      </div>
                    ) : (
                      <>
                        <div className="fpi-competitor-header">
                          <p className="fpi-card-sub" style={{ margin: 0 }}>
                            Tick the competitor airlines operating on this corridor to benchmark against:
                          </p>
                          <div className="fpi-quick-actions">
                            <button
                              type="button"
                              onClick={() => setCheckedCompetitors([...competitorAirlines])}
                              className="fpi-quick-btn"
                            >
                              Select All ({competitorAirlines.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckedCompetitors([])}
                              className="fpi-quick-btn"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="fpi-pills-row">
                          {competitorAirlines.map((comp) => {
                            const isChecked = checkedCompetitors.includes(comp);
                            const meta = getAirMeta(comp);
                            const compFlightsCount = flights.filter((f) => f.a.n === comp).length;

                            return (
                              <button
                                key={comp}
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked}
                                className={`fpi-pill ${isChecked ? "active" : ""}`}
                                onClick={() => toggleCompetitorSelection(comp)}
                              >
                                <span className={`fpi-checkbox-box ${isChecked ? "checked" : ""}`}>
                                  {isChecked && <FiCheck className="fpi-checkbox-check" />}
                                </span>
                                <span className="fpi-pill-avatar" style={{ background: meta.col }}>
                                  {meta.c}
                                </span>
                                <span className="fpi-pill-name">{comp}</span>
                                <small className="fpi-pill-count">({compFlightsCount})</small>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 4: Choose Hours */}
                  <div className="fpi-card">
                    <div className="fpi-card-step">
                      <span className="fpi-step-num">4</span>
                      <span>Choose Hours (Comparison Window)</span>
                    </div>

                    <p className="fpi-card-sub" style={{ margin: "0 0px 16px 16px" }}>
                      Choose 1 to 10 hours to benchmark rival flights before and after your departures:
                    </p>

                    <div className="fpi-hours-control-row">
                      <div className="fpi-hours-select-wrapper">
                        <ModernHoursSelect
                          value={windowHours}
                          onChange={(val) => setWindowHours(val)}
                        />
                      </div>

                      <div className="fpi-hours-quick-presets">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((hr) => (
                          <button
                            key={hr}
                            type="button"
                            onClick={() => setWindowHours(hr)}
                            className={`fpi-quick-btn ${windowHours === hr ? "fpi-quick-btn-active" : ""}`}
                          >
                            {hr} hr{hr > 1 ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Live Price Comparison Result */}
                  <div className="fpi-card fpi-result-card">
                    <div className="fpi-card-step">
                      <span className="fpi-step-num">5</span>
                      <span>
                        Price Comparison Matrix · Competitors within {windowHours} Hour{windowHours > 1 ? "s" : ""} of Each Departure
                      </span>
                    </div>

                    {/* 7-day Date Navigation Strip */}
                    <div className="fpi-datebar">
                      <button
                        type="button"
                        onClick={() => handleDateShift(-1)}
                        disabled={isLoading}
                        className="fpi-date-arrow"
                        title="Previous day"
                      >
                        <FiChevronLeft />
                      </button>

                      <div className="fpi-date-days-container">
                        {dateStrip.map(({ date, isPast, isSelected }, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (!isPast && !isLoading) {
                                setSelectedDate(date);
                                executeSearch(origin, destination, date);
                              }
                            }}
                            disabled={isPast || isLoading}
                            className={`fpi-day-btn ${isSelected ? "on" : ""} ${
                              isPast ? "disabled" : ""
                            }`}
                          >
                            <small>
                              {date.toLocaleDateString("en-IN", { weekday: "short" })}
                            </small>
                            <strong>
                              {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                            </strong>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDateShift(1)}
                        disabled={isLoading}
                        className="fpi-date-arrow"
                        title="Next day"
                      >
                        <FiChevronRight />
                      </button>
                    </div>

                    {/* Price Legend */}
                    <div className="fpi-legend-row">
                      <span>
                        <span className="fpi-tag fpi-tag-cheap">cheaper</span> Competitor is priced lower than your flight
                      </span>
                      <span>
                        <span className="fpi-tag fpi-tag-dear">higher</span> You are priced lower (you are cheaper)
                      </span>
                    </div>

                    {/* Dynamic Comparison Results */}
                    <div className="fpi-results-list">
                      {comparisons.length === 0 ? (
                        <div className="fpi-empty-state">
                          <FiInfo style={{ fontSize: 26, marginBottom: 8, color: "var(--fpi-brand)" }} />
                          <p>
                            Please tick at least one flight in Step 2 to view competitor fare comparisons.
                          </p>
                        </div>
                      ) : (
                        comparisons.map(
                          ({
                            myFlight,
                            beforeList,
                            afterList,
                            cheaperCount,
                            totalNear,
                          }) => {
                            const hasCompetitors = totalNear > 0;
                            const isCheapest = hasCompetitors && cheaperCount === 0;

                            return (
                              <div key={myFlight.no} className="fpi-comparison-box">
                                <div className="fpi-cmp-header">
                                  <div
                                    className="fpi-cmp-avatar"
                                    style={{ background: myFlight.a.col }}
                                  >
                                    {myFlight.a.c}
                                  </div>
                                  <div className="fpi-cmp-info">
                                    <span className="fpi-cmp-label">Your Flight</span>
                                    <span className="fpi-cmp-val">{myFlight.no}</span>
                                  </div>
                                  <div className="fpi-cmp-info">
                                    <span className="fpi-cmp-label">Departure</span>
                                    <span className="fpi-cmp-val">{fmtMinutes(myFlight.dep)}</span>
                                  </div>
                                  <div className="fpi-cmp-info">
                                    <span className="fpi-cmp-label">Arrival</span>
                                    <span className="fpi-cmp-val">
                                      {myFlight.arrival_time} ({myFlight.arrival_date})
                                    </span>
                                  </div>
                                  <div className="fpi-cmp-info">
                                    <span className="fpi-cmp-label">Your Fare</span>
                                    <span className="fpi-cmp-price">{rupee(myFlight.p)}</span>
                                  </div>

                                  <div className="fpi-cmp-verdict-container">
                                    {!hasCompetitors ? (
                                      <span className="fpi-verdict-pill fpi-verdict-neutral">
                                        No competitors within {windowHours} hour{windowHours > 1 ? "s" : ""}
                                      </span>
                                    ) : isCheapest ? (
                                      <span className="fpi-verdict-pill fpi-verdict-success">
                                        ✓ You are the cheapest flight
                                      </span>
                                    ) : (
                                      <span className="fpi-verdict-pill fpi-verdict-alert">
                                        ⚠️ {cheaperCount} of {totalNear} competitors cheaper
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="fpi-cmp-columns">
                                  {/* Before Column */}
                                  <div className="fpi-cmp-col">
                                    <h3>
                                      {windowHours} Hour{windowHours > 1 ? "s" : ""} Before · {fmtMinutes(myFlight.dep - windowHours * 60)} to{" "}
                                      {fmtMinutes(myFlight.dep)}
                                    </h3>
                                    {beforeList.length === 0 ? (
                                      <p className="fpi-no-flights">
                                        No competitor departures in the {windowHours} hour{windowHours > 1 ? "s" : ""} before
                                      </p>
                                    ) : (
                                      beforeList.map((comp) => {
                                        const diff = comp.p - myFlight.p;
                                        return (
                                          <div key={comp.no} className="fpi-flight-row">
                                            <div
                                              className="fpi-mini-avatar"
                                              style={{ background: comp.a.col }}
                                            >
                                              {comp.a.c}
                                            </div>
                                            <div className="fpi-flight-details">
                                              <div className="fpi-flight-name">{comp.a.n}</div>
                                              <div className="fpi-flight-meta">{comp.no}</div>
                                              <div className="fpi-flight-meta">
                                                departs {fmtMinutes(comp.dep)}
                                                {comp.arrival_time && comp.arrival_time !== "—"
                                                  ? ` · arrives ${comp.arrival_time}`
                                                  : ""}
                                              </div>
                                              <div className="fpi-flight-meta">{comp.stops}</div>
                                            </div>
                                            <div className="fpi-flight-price-col">
                                              <div className="fpi-flight-price">{rupee(comp.p)}</div>
                                              {diff < 0 ? (
                                                <span className="fpi-tag fpi-tag-cheap">
                                                  {rupee(-diff)} cheaper
                                                </span>
                                              ) : diff > 0 ? (
                                                <span className="fpi-tag fpi-tag-dear">
                                                  {rupee(diff)} higher
                                                </span>
                                              ) : (
                                                <span className="fpi-tag fpi-tag-same">Same price</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* After Column */}
                                  <div className="fpi-cmp-col">
                                    <h3>
                                      {windowHours} Hour{windowHours > 1 ? "s" : ""} After · {fmtMinutes(myFlight.dep)} to{" "}
                                      {fmtMinutes(myFlight.dep + windowHours * 60)}
                                    </h3>
                                    {afterList.length === 0 ? (
                                      <p className="fpi-no-flights">
                                        No competitor departures in the {windowHours} hour{windowHours > 1 ? "s" : ""} after
                                      </p>
                                    ) : (
                                      afterList.map((comp) => {
                                        const diff = comp.p - myFlight.p;
                                        return (
                                          <div key={comp.no} className="fpi-flight-row">
                                            <div
                                              className="fpi-mini-avatar"
                                              style={{ background: comp.a.col }}
                                            >
                                              {comp.a.c}
                                            </div>
                                            <div className="fpi-flight-details">
                                              <div className="fpi-flight-name">{comp.a.n}</div>
                                              <div className="fpi-flight-meta">{comp.no}</div>
                                              <div className="fpi-flight-meta">
                                                departs {fmtMinutes(comp.dep)}
                                                {comp.arrival_time && comp.arrival_time !== "—"
                                                  ? ` · arrives ${comp.arrival_time}`
                                                  : ""}
                                              </div>
                                              <div className="fpi-flight-meta">{comp.stops}</div>
                                            </div>
                                            <div className="fpi-flight-price-col">
                                              <div className="fpi-flight-price">{rupee(comp.p)}</div>
                                              {diff < 0 ? (
                                                <span className="fpi-tag fpi-tag-cheap">
                                                  {rupee(-diff)} cheaper
                                                </span>
                                              ) : diff > 0 ? (
                                                <span className="fpi-tag fpi-tag-dear">
                                                  {rupee(diff)} higher
                                                </span>
                                              ) : (
                                                <span className="fpi-tag fpi-tag-same">Same price</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Educational Breakdown */}
        <section className="fpi-content-block fpi-bg-alt" id="what-is-fpi">
          <div className="fpi-container">
            <h2>What is Flight Price Intelligence?</h2>
            <div className="fpi-def-card">
              <p>
                <strong>Flight price intelligence</strong> is the practice of collecting competitor
                airfares from airline websites, online travel agencies (OTAs) and meta-search sites,
                then comparing them with your own fares in real-time. Pricing and revenue teams use
                it to decide when to raise, hold, or lower fares, and spot when a rival or an OTA is
                undercutting direct booking prices.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="fpi-content-block" id="how-it-works">
          <div className="fpi-container">
            <h2>How It Works</h2>
            <p className="fpi-section-subtitle">
              Five simple steps from route selection to actionable airfare revenue decisions.
            </p>
            <ol className="fpi-steps-grid">
              <li>
                <h3>1. Select Route & Date</h3>
                <p>Choose origin, destination airport, and desired travel departure date.</p>
              </li>
              <li>
                <h3>2. Choose Your Flights</h3>
                <p>Pick your operating carrier and tick the flight departures to monitor.</p>
              </li>
              <li>
                <h3>3. Choose Competitors</h3>
                <p>Tick the rival airlines you compete against on that active corridor.</p>
              </li>
              <li>
                <h3>4. Choose Hours</h3>
                <p>Select your comparison time window from 1 to 10 hours (default 3 hours).</p>
              </li>
              <li>
                <h3>5. Read Comparison</h3>
                <p>
                  View competitor fares within your chosen window before and after each departure with exact price spreads.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Platform Features */}
        <section className="fpi-content-block fpi-bg-alt" id="features">
          <div className="fpi-container">
            <h2>Platform Features</h2>
            <p className="fpi-section-subtitle">
              Everything revenue analysts need to answer: &quot;Are we priced right for this flight?&quot;
            </p>
            <div className="fpi-features-grid">
              <div className="fpi-feat-card">
                <h3>Flexible Window Proximity (1-10 Hours)</h3>
                <p>
                  Filters strictly the competitor flights a passenger would realistically choose instead of yours.
                </p>
              </div>
              <div className="fpi-feat-card">
                <h3>Cheaper / Higher at a Glance</h3>
                <p>
                  Green and red tags indicate exact rupee price differences for every competitor flight.
                </p>
              </div>
              <div className="fpi-feat-card">
                <h3>One-Tap Date Change</h3>
                <p>
                  Interactive 7-day strip enables jumping between travel dates with instant re-computation.
                </p>
              </div>
              <div className="fpi-feat-card">
                <h3>Multiple Flights Simultaneously</h3>
                <p>Compare all departures on high-frequency routes side-by-side in a single view.</p>
              </div>
              <div className="fpi-feat-card">
                <h3>OTA Rate Parity Auditing</h3>
                <p>
                  Detect when third-party OTAs list your flight below your official website brand price.
                </p>
              </div>
              <div className="fpi-feat-card">
                <h3>Powered by Real-Time Data</h3>
                <p>
                  Fares are extracted on high-speed resilient cloud scrapers with automatic anti-bot bypass.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Uses Flight Price Intelligence */}
        <section className="fpi-content-block" id="target-audiences">
          <div className="fpi-container">
            <h2>Who Uses Flight Price Intelligence?</h2>
            <div className="fpi-who-grid">
              <div className="fpi-who-card">
                <h3>Airlines</h3>
                <p>
                  Revenue management and commercial pricing teams tracking competitor yield curves.
                </p>
              </div>
              <div className="fpi-who-card">
                <h3>Online Travel Agencies (OTAs)</h3>
                <p>
                  Travel portals checking inventory margins and competitor package rate parity.
                </p>
              </div>
              <div className="fpi-who-card">
                <h3>Corporate Travel Desks</h3>
                <p>Corporate travel managers booking optimum cost departures for business fleets.</p>
              </div>
              <div className="fpi-who-card">
                <h3>General Sales Agents (GSAs)</h3>
                <p>GSAs representing regional airline carriers in competitive local markets.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="fpi-content-block fpi-bg-alt" id="faq">
          <div className="fpi-container">
            <h2>Frequently Asked Questions</h2>
            <div className="fpi-faq-container">
              <details open>
                <summary>What is flight price intelligence?</summary>
                <div className="fpi-faq-body">
                  Flight price intelligence is the automated collection of competitor airfares from
                  airline websites, OTAs, and meta-search engines, enabling pricing teams to optimize
                  yields and adjust fares dynamically.
                </div>
              </details>
              <details>
                <summary>Why compare competitor flights within flexible departure windows?</summary>
                <div className="fpi-faq-body">
                  Passengers generally book flights within a reasonable departure time window.
                  Monitoring flights within 1 to 10 hours on either side isolates the exact options customers
                  substitute for your flight.
                </div>
              </details>
              <details>
                <summary>Where does the fare data come from?</summary>
                <div className="fpi-faq-body">
                  Fares are extracted in real-time by dedicated airline scraping engines with residential
                  proxy rotation and anti-bot defense.
                </div>
              </details>
              <details>
                <summary>Can I integrate this data into our internal Revenue Management System (RMS)?</summary>
                <div className="fpi-faq-body">
                  Yes! JSON REST API endpoints, webhooks, and bulk export integrations (cURL, Python, Node.js)
                  are available to stream fresh price intelligence directly into your RMS.
                </div>
              </details>
              <details>
                <summary>How can I schedule a live enterprise demo?</summary>
                <div className="fpi-faq-body">
                  Contact our enterprise solutions team at{" "}
                  <a href="mailto:rajeshm@gramosoft.in" style={{ color: "#0b5cad", fontWeight: 600 }}>
                    rajeshm@gramosoft.in
                  </a>{" "}
                  to configure your custom airline route benchmarks.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="fpi-cta-section">
          <div className="fpi-container">
            <div className="fpi-cta-box">
              <div className="fpi-cta-text">
                <h2>See Your Airline Routes in Action</h2>
                <p>
                  Connect your key routes and competitors to receive real-time price monitoring
                  dashboards and API feeds.
                </p>
              </div>
              <a
                href="mailto:rajeshm@gramosoft.in?subject=Flight%20Price%20Intelligence%20Enterprise%20Trial"
                className="fpi-btn fpi-btn-white"
              >
                Book Enterprise Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
