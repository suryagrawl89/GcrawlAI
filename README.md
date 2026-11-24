# Flight Price Intelligence (Standalone)

An independent, production-ready React + TypeScript + Vite project focused exclusively on real-time flight price intelligence, competitor benchmark analytics, proximity window comparisons (1–10 hours), and multi-carrier fare tracking.

---

## ✈️ Key Features

- **Real-Time Fare Extraction**: Powered by Google Flights live integration (`POST /api/v1/google-flights`) with support for one-way and full flight schedules.
- **Airport Autocomplete**: Fast, debounced IATA/ICAO code lookups via `FreeAirportDB` with curated fallback of major global hubs.
- **Dynamic Proximity Window (1–10 Hours)**: Flexible departure window selector to compare flights departing ±1h to ±10h relative to your target flight.
- **Interactive 7-Day Date Picker Strip**: Easy date switching with one-click fare comparison across consecutive travel dates.
- **Competitor Benchmark Breakdown**:
  - Automatically identifies Cheaper, Same, and More Expensive competitor flights.
  - Computes minimum, maximum, and average price spreads.
  - Highlights optimal pricing positioning and saving opportunities.
- **Multi-Filter & Sorting Dashboard**:
  - Filter by Stops (Non-stop, 1 stop, 2+ stops).
  - Filter by Operating Carriers (IndiGo, Air India, Emirates, Singapore Airlines, etc.).
  - Sort by Price (Low to High), Duration, Departure Time, or Arrival Time.
- **Modern Responsive Design**: Dark-mode aesthetic with custom glassmorphism, responsive cards, and mobile-friendly navigation.
- **Self-Contained Architecture**: Operates independently without any extraneous web-scraping or admin modules.

---

## 📁 Project Structure

```text
flightpriceintelligenceduplicate/
├── index.html                           # App entry HTML template
├── package.json                         # Dependencies & scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite bundler configuration
├── src/
│   ├── main.tsx                         # React 19 application entry point
│   ├── App.tsx                          # Client-side router & toast notifications
│   ├── index.css                        # Tailwind CSS imports & global resets
│   ├── vite-env.d.ts                    # Vite client types
│   ├── components/
│   │   ├── common/
│   │   │   ├── AirportSelectInput.tsx   # Debounced airport search component
│   │   │   └── SEO.tsx                  # Dynamic SEO tags & JSON-LD metadata
│   │   ├── layout/
│   │   │   ├── Navbar.tsx               # Dedicated header navigation
│   │   │   └── Footer.tsx               # Footer with corridor links & tech details
│   │   └── ErrorBoundary.tsx            # Graceful crash handling boundary
│   ├── page/
│   │   ├── FlightPriceIntelligence.tsx  # Core intelligence dashboard & analytics
│   │   └── FlightPriceIntelligence.css  # Full component styling (~2100 lines)
│   ├── services/
│   │   ├── apiConfig.ts                 # Base API config & fallback URL resolution
│   │   └── flightApi.ts                 # Typed Axios client for Google Flights endpoint
│   └── utils/
│       └── airportApi.ts                # FreeAirportDB client & curated global hubs
```

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **pnpm** or **yarn**

### 2. Installation
Navigate into the `flightpriceintelligenceduplicate` folder and install dependencies:

```bash
cd flightpriceintelligenceduplicate
npm install
```

### 3. Run Development Server
Start the Vite local development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5174/` (or next available port).

### 4. Build for Production
Create an optimized production bundle:

```bash
npm run build
```

The compiled files will be output to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## ⚙️ Configuration & Environment Variables

By default, the application connects to the live production endpoint at `https://gcrawlai.com/gc/api/v1`.

To customize the backend endpoint, create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://gcrawlai.com/gc/api/v1
```

---

## 🛡️ License & Credits

Built as an independent module based on the GcrawlAI Flight Price Intelligence feature.
All airport lookup data is powered by [FreeAirportDB](https://freeairportdb.com).
