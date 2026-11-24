import axios from "axios";
import { GOOGLE_FLIGHTS_ENDPOINT } from "./apiConfig";

export interface GoogleFlightsPayload {
  trip_type?: string;
  origin: string;
  destination: string;
  outbound_date: string;
  proxy_geo?: string;
  full_flight?: boolean;
}

export interface FlightResponseItem {
  airline: string;
  flight_number?: string;
  departure_time: string;
  arrival_time?: string;
  arrival_date?: string;
  arr_time?: string;
  arr_date?: string;
  price: string | number;
  stops?: string;
  duration?: string;
}

export interface GoogleFlightsResponse {
  status: string;
  message?: string;
  flights: FlightResponseItem[];
}

export async function fetchGoogleFlights(payload: GoogleFlightsPayload): Promise<GoogleFlightsResponse> {
  const response = await axios.post<GoogleFlightsResponse>(GOOGLE_FLIGHTS_ENDPOINT, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 5 * 60 * 1000,
  });

  return response.data;
}
