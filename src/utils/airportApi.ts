/**
 * airportApi.ts - FreeAirportDB API client & helper utilities
 * Uses https://api.freeairportdb.com/v1 for global airport search & details
 */

export interface FreeAirportItem {
  code: string;
  iata?: string | null;
  icao?: string | null;
  name: string;
  continent_code?: string;
  continent_name?: string;
  region_code?: string;
  region_name?: string;
  country_code?: string;
  country_name?: string;
  municipality?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  elevation_ft?: number;
  time_zone?: string;
  type?: string;
  distance_km?: number;
  distance_mile?: number;
}

export interface AirportOption {
  code: string;
  iata?: string;
  icao?: string;
  name: string;
  continent_code?: string;
  continent_name?: string;
  region_code?: string;
  region_name?: string;
  country_code?: string;
  country_name?: string;
  municipality?: string;
  city: string;
  country: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  elevation_ft?: number;
  time_zone?: string;
  type?: string;
  distance_km?: number;
  distance_mile?: number;
}

const FREE_AIRPORT_BASE_URL = "https://api.freeairportdb.com/v1";

// Curated top global & regional hubs for initial display when input is empty
export const DEFAULT_MAJOR_AIRPORTS: AirportOption[] = [
  {
    code: "MAA",
    iata: "MAA",
    icao: "VOMM",
    name: "Chennai International Airport",
    city: "Chennai",
    municipality: "Chennai",
    region_code: "IN-TN",
    region_name: "Tamil Nadu",
    country_code: "IN",
    country_name: "India",
    countryCode: "IN",
    country: "India",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Kolkata",
  },
  {
    code: "HYD",
    iata: "HYD",
    icao: "VOHS",
    name: "Rajiv Gandhi International Airport",
    city: "Hyderabad",
    municipality: "Hyderabad",
    region_code: "IN-TG",
    region_name: "Telangana",
    country_code: "IN",
    country_name: "India",
    countryCode: "IN",
    country: "India",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Kolkata",
  },
  {
    code: "DEL",
    iata: "DEL",
    icao: "VIDP",
    name: "Indira Gandhi International Airport",
    city: "New Delhi",
    municipality: "New Delhi",
    region_code: "IN-DL",
    region_name: "Delhi",
    country_code: "IN",
    country_name: "India",
    countryCode: "IN",
    country: "India",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Kolkata",
  },
  {
    code: "BOM",
    iata: "BOM",
    icao: "VABB",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    city: "Mumbai",
    municipality: "Mumbai",
    region_code: "IN-MH",
    region_name: "Maharashtra",
    country_code: "IN",
    country_name: "India",
    countryCode: "IN",
    country: "India",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Kolkata",
  },
  {
    code: "BLR",
    iata: "BLR",
    icao: "VOBL",
    name: "Kempegowda International Airport",
    city: "Bengaluru",
    municipality: "Bengaluru",
    region_code: "IN-KA",
    region_name: "Karnataka",
    country_code: "IN",
    country_name: "India",
    countryCode: "IN",
    country: "India",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Kolkata",
  },
  {
    code: "DXB",
    iata: "DXB",
    icao: "OMDB",
    name: "Dubai International Airport",
    city: "Dubai",
    municipality: "Dubai",
    region_code: "AE-DU",
    region_name: "Dubai",
    country_code: "AE",
    country_name: "United Arab Emirates",
    countryCode: "AE",
    country: "United Arab Emirates",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Dubai",
  },
  {
    code: "SIN",
    iata: "SIN",
    icao: "WSSS",
    name: "Singapore Changi Airport",
    city: "Singapore",
    municipality: "Singapore",
    region_code: "SG-01",
    region_name: "Central Singapore",
    country_code: "SG",
    country_name: "Singapore",
    countryCode: "SG",
    country: "Singapore",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
    time_zone: "Asia/Singapore",
  },
  {
    code: "LHR",
    iata: "LHR",
    icao: "EGLL",
    name: "Heathrow Airport",
    city: "London",
    municipality: "London",
    region_code: "GB-ENG",
    region_name: "England",
    country_code: "GB",
    country_name: "United Kingdom",
    countryCode: "GB",
    country: "United Kingdom",
    continent_code: "EU",
    continent_name: "Europe",
    type: "large_airport",
    time_zone: "Europe/London",
  },
  {
    code: "JFK",
    iata: "JFK",
    icao: "KJFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    municipality: "New York",
    region_code: "US-NY",
    region_name: "New York",
    country_code: "US",
    country_name: "United States",
    countryCode: "US",
    country: "United States",
    continent_code: "NA",
    continent_name: "North America",
    type: "large_airport",
    time_zone: "America/New_York",
  },
  {
    code: "DOH",
    iata: "DOH",
    icao: "OTHH",
    name: "Hamad International Airport",
    city: "Doha",
    municipality: "Doha",
    region_code: "QA-DA",
    region_name: "Ad Dawhah",
    country_code: "QA",
    country_name: "Qatar",
    countryCode: "QA",
    country: "Qatar",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
  },
  {
    code: "BKK",
    iata: "BKK",
    icao: "VTBS",
    name: "Suvarnabhumi Airport",
    city: "Bangkok",
    municipality: "Bangkok",
    region_code: "TH-10",
    region_name: "Bangkok",
    country_code: "TH",
    country_name: "Thailand",
    countryCode: "TH",
    country: "Thailand",
    continent_code: "AS",
    continent_name: "Asia",
    type: "large_airport",
  },
  {
    code: "CDG",
    iata: "CDG",
    icao: "LFPG",
    name: "Charles de Gaulle Airport",
    city: "Paris",
    municipality: "Paris",
    region_code: "FR-IDF",
    region_name: "Île-de-France",
    country_code: "FR",
    country_name: "France",
    countryCode: "FR",
    country: "France",
    continent_code: "EU",
    continent_name: "Europe",
    type: "large_airport",
  }
];

export function normalizeRawAirport(item: FreeAirportItem): AirportOption | null {
  if (!item) return null;
  const primaryCode = (item.iata || item.code || "").trim().toUpperCase();
  if (!primaryCode && !item.name) return null;

  return {
    code: primaryCode,
    iata: item.iata ? item.iata.toUpperCase() : primaryCode,
    icao: item.icao ? item.icao.toUpperCase() : item.code ? item.code.toUpperCase() : undefined,
    name: item.name || primaryCode,
    continent_code: item.continent_code,
    continent_name: item.continent_name,
    region_code: item.region_code,
    region_name: item.region_name,
    country_code: item.country_code,
    country_name: item.country_name,
    municipality: item.municipality,
    city: item.municipality || item.city || "",
    country: item.country_name || "",
    countryCode: item.country_code || undefined,
    latitude: item.latitude,
    longitude: item.longitude,
    elevation: item.elevation,
    elevation_ft: item.elevation_ft,
    time_zone: item.time_zone,
    type: item.type,
    distance_km: item.distance_km,
    distance_mile: item.distance_mile,
  };
}

export function matchesAirportQuery(a: AirportOption, q: string): boolean {
  if (!q.trim()) return true;
  const upper = q.trim().toUpperCase();
  const lower = q.trim().toLowerCase();

  return Boolean(
    (a.iata && a.iata.toUpperCase().includes(upper)) ||
    (a.code && a.code.toUpperCase().includes(upper)) ||
    (a.icao && a.icao.toUpperCase().includes(upper)) ||
    (a.name && a.name.toLowerCase().includes(lower)) ||
    (a.continent_code && a.continent_code.toUpperCase().includes(upper)) ||
    (a.continent_name && a.continent_name.toLowerCase().includes(lower)) ||
    (a.region_code && a.region_code.toUpperCase().includes(upper)) ||
    (a.region_name && a.region_name.toLowerCase().includes(lower)) ||
    (a.country_code && a.country_code.toUpperCase().includes(upper)) ||
    (a.countryCode && a.countryCode.toUpperCase().includes(upper)) ||
    (a.country_name && a.country_name.toLowerCase().includes(lower)) ||
    (a.country && a.country.toLowerCase().includes(lower)) ||
    (a.municipality && a.municipality.toLowerCase().includes(lower)) ||
    (a.city && a.city.toLowerCase().includes(lower))
  );
}

export function sortAirportsByRelevance(list: AirportOption[], q: string): AirportOption[] {
  const upper = q.trim().toUpperCase();
  const lower = q.trim().toLowerCase();

  return list.sort((a, b) => {
    const aIata = (a.iata || a.code || "").toUpperCase();
    const bIata = (b.iata || b.code || "").toUpperCase();
    const aIcao = (a.icao || "").toUpperCase();
    const bIcao = (b.icao || "").toUpperCase();
    const aCountryCode = (a.country_code || a.countryCode || "").toUpperCase();
    const bCountryCode = (b.country_code || b.countryCode || "").toUpperCase();

    const aExactCode = aIata === upper || aIcao === upper || a.code.toUpperCase() === upper;
    const bExactCode = bIata === upper || bIcao === upper || b.code.toUpperCase() === upper;
    if (aExactCode && !bExactCode) return -1;
    if (!aExactCode && bExactCode) return 1;

    const aStartsCode = aIata.startsWith(upper) || aIcao.startsWith(upper) || a.code.toUpperCase().startsWith(upper);
    const bStartsCode = bIata.startsWith(upper) || bIcao.startsWith(upper) || b.code.toUpperCase().startsWith(upper);
    if (aStartsCode && !bStartsCode) return -1;
    if (!aStartsCode && bStartsCode) return 1;

    const aExactCountry = aCountryCode === upper || (a.continent_code || "").toUpperCase() === upper || (a.region_code || "").toUpperCase() === upper;
    const bExactCountry = bCountryCode === upper || (b.continent_code || "").toUpperCase() === upper || (b.region_code || "").toUpperCase() === upper;
    if (aExactCountry && !bExactCountry) return -1;
    if (!aExactCountry && bExactCountry) return 1;

    const aStartsName =
      a.name.toLowerCase().startsWith(lower) ||
      (a.city && a.city.toLowerCase().startsWith(lower)) ||
      (a.country && a.country.toLowerCase().startsWith(lower)) ||
      (a.region_name && a.region_name.toLowerCase().startsWith(lower));
    const bStartsName =
      b.name.toLowerCase().startsWith(lower) ||
      (b.city && b.city.toLowerCase().startsWith(lower)) ||
      (b.country && b.country.toLowerCase().startsWith(lower)) ||
      (b.region_name && b.region_name.toLowerCase().startsWith(lower));
    if (aStartsName && !bStartsName) return -1;
    if (!aStartsName && bStartsName) return 1;

    return 0;
  });
}

export async function getFreeAirportByCode(code: string): Promise<AirportOption | null> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const url = `${FREE_AIRPORT_BASE_URL}/airports/${encodeURIComponent(cleanCode)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (res.ok) {
      const resJson = await res.json();
      const item: FreeAirportItem = resJson?.data || resJson;
      const normalized = normalizeRawAirport(item);
      if (normalized) return normalized;
    }
  } catch (err) {
    console.warn(`FreeAirportDB get airport by code (${cleanCode}) failed:`, err);
  }

  const match = DEFAULT_MAJOR_AIRPORTS.find(
    (a) => a.code.toUpperCase() === cleanCode || (a.icao && a.icao.toUpperCase() === cleanCode)
  );
  return match || null;
}

export async function searchFreeAirports(query: string, limit = 20): Promise<AirportOption[]> {
  const q = (query || "").trim();
  if (!q) return DEFAULT_MAJOR_AIRPORTS;

  const upperQ = q.toUpperCase();
  const isLikelyCode = q.length >= 2 && q.length <= 5;
  const resultsMap = new Map<string, AirportOption>();

  try {
    const promises: Promise<any>[] = [
      fetch(`${FREE_AIRPORT_BASE_URL}/airports?q=${encodeURIComponent(q)}&limit=${limit}`, {
        headers: { Accept: "application/json" },
      }).then((r) => (r.ok ? r.json() : null)),
    ];

    if (isLikelyCode) {
      promises.push(
        fetch(`${FREE_AIRPORT_BASE_URL}/airports/${encodeURIComponent(upperQ)}`, {
          headers: { Accept: "application/json" },
        }).then((r) => (r.ok ? r.json() : null))
      );
    }

    const settled = await Promise.allSettled(promises);

    if (isLikelyCode && settled[1] && settled[1].status === "fulfilled" && settled[1].value) {
      const directData = settled[1].value;
      const item: FreeAirportItem = directData?.data || directData;
      const normalized = normalizeRawAirport(item);
      if (normalized && normalized.code) {
        resultsMap.set(normalized.code.toUpperCase(), normalized);
      }
    }

    if (settled[0] && settled[0].status === "fulfilled" && settled[0].value) {
      const listData = settled[0].value;
      const list: FreeAirportItem[] = Array.isArray(listData)
        ? listData
        : Array.isArray(listData?.data)
          ? listData.data
          : [];

      list.forEach((item) => {
        const normalized = normalizeRawAirport(item);
        if (normalized && normalized.code) {
          const key = normalized.code.toUpperCase();
          if (!resultsMap.has(key)) {
            resultsMap.set(key, normalized);
          }
        }
      });
    }
  } catch (err) {
    console.warn("FreeAirportDB search request failed:", err);
  }

  if (resultsMap.size > 0) {
    const list = Array.from(resultsMap.values());
    return sortAirportsByRelevance(list, q);
  }

  const matchedDefaults = DEFAULT_MAJOR_AIRPORTS.filter((a) => matchesAirportQuery(a, q));
  return sortAirportsByRelevance(matchedDefaults, q);
}
