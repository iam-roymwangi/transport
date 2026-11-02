/**
 * Google Maps and Geolocation Utilities
 * Supports parsing coordinates from Google Maps URLs,
 * generating Google Maps links, and calculating distances (Haversine + Google Maps API support).
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Hub locations for transport destinations/pickups
export const HUB_LOCATIONS: Record<string, Coordinates & { name: string }> = {
  Westend: { name: 'Westend Office', latitude: -1.2612, longitude: 36.8044 },
  Delta: { name: 'Delta Corner', latitude: -1.2667, longitude: 36.8075 },
  Riverside: { name: 'Riverside Hub', latitude: -1.2750, longitude: 36.7950 },
  'Two Rivers': { name: 'Two Rivers Mall Hub', latitude: -1.2136, longitude: 36.7978 },
};

/**
 * Extracts latitude and longitude from a string:
 * - Direct coordinates: "-1.2921, 36.8219" or "-1.2921 36.8219"
 * - Google Maps URL:
 *     https://maps.google.com/?q=-1.2921,36.8219
 *     https://www.google.com/maps/@-1.2921,36.8219,15z
 *     https://www.google.com/maps/place/-1.2921,36.8219
 *     https://www.google.com/maps/search/?api=1&query=-1.2921,36.8219
 */
export function extractCoordinates(input: string | null | undefined): Coordinates | null {
  if (!input) return null;
  const str = input.trim();

  // Pattern 1: URL with query or place containing lat,lng
  // e.g. q=-1.2921,36.8219 or query=-1.2921,36.8219 or place/-1.2921,36.8219
  const urlCoordMatch = str.match(/(?:q=|query=|place\/|@)(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (urlCoordMatch) {
    const lat = parseFloat(urlCoordMatch[1]);
    const lng = parseFloat(urlCoordMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: round6(lat), longitude: round6(lng) };
    }
  }

  // Pattern 2: Raw comma/space separated coordinates: "-1.2921, 36.8219"
  const rawCoordMatch = str.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lng = parseFloat(rawCoordMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: round6(lat), longitude: round6(lng) };
    }
  }

  // Pattern 3: ll=-1.2921,36.8219
  const llMatch = str.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (llMatch) {
    const lat = parseFloat(llMatch[1]);
    const lng = parseFloat(llMatch[2]);
    if (isValidLat(lat) && isValidLng(lng)) {
      return { latitude: round6(lat), longitude: round6(lng) };
    }
  }

  return null;
}

function isValidLat(lat: number) {
  return !isNaN(lat) && lat >= -90 && lat <= 90;
}

function isValidLng(lng: number) {
  return !isNaN(lng) && lng >= -180 && lng <= 180;
}

function round6(num: number) {
  return Math.round(num * 1000000) / 1000000;
}

/**
 * Builds a standard Google Maps URL for given coordinates or address
 */
export function buildGoogleMapsUrl(lat?: number | null, lng?: number | null, address?: string | null): string {
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return '';
}

/**
 * Calculate Great Circle (Haversine) distance between two points in Kilometers
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Road factor estimate (~1.3x Euclidean/Haversine distance in city networks)
  const estimatedDrivingKm = straightLineKm * 1.3;
  return Math.round(estimatedDrivingKm * 10) / 10;
}

/**
 * Calculate distance from destination/staff coordinates to a specified Hub
 */
export function calculateDistanceToHub(
  staffCoord: Coordinates,
  hubName: string
): { distanceKm: number; hubName: string } | null {
  const hub = HUB_LOCATIONS[hubName] || HUB_LOCATIONS['Westend'];
  if (!hub) return null;

  const distanceKm = calculateHaversineDistance(staffCoord, hub);
  return { distanceKm, hubName: hub.name };
}

/**
 * Google Maps API Distance Matrix (optional live integration if GOOGLE_MAPS_API_KEY is configured)
 */
export async function fetchGoogleMapsDistanceMatrix(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ distanceKm: number; durationText: string; isLive: boolean }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=driving&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        const meters = element.distance.value;
        const durationText = element.duration.text;
        return {
          distanceKm: Math.round((meters / 1000) * 10) / 10,
          durationText,
          isLive: true,
        };
      }
    } catch (err) {
      console.warn('Google Maps API request failed, falling back to Haversine calculation:', err);
    }
  }

  // Fallback calculation
  const distanceKm = calculateHaversineDistance(origin, destination);
  const estimatedMins = Math.round((distanceKm / 35) * 60); // assuming 35km/h city driving
  return {
    distanceKm,
    durationText: `${estimatedMins} mins (est.)`,
    isLive: false,
  };
}
