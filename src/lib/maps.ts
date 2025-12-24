export function getGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatDriveTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

// Local memory cache for drive times (to avoid repeated server calls in same session)
const localDriveTimeCache = new Map<string, number>();

// Server API URL for drive time proxy (avoids CORS issues with Google Maps API)
const API_URL = process.env.NEXT_PUBLIC_SYNC_API_URL || 'https://webhooks.ai-app.space';

// Get drive time between two coordinates via server proxy
// Server handles caching and Google Maps API calls
export async function fetchDriveTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const routeKey = `${fromLat},${fromLng}->${toLat},${toLng}`;

  // Check local memory cache first (for same-session speed)
  if (localDriveTimeCache.has(routeKey)) {
    return localDriveTimeCache.get(routeKey)!;
  }

  // Call server proxy (handles DB cache + Google Maps API)
  try {
    const response = await fetch(`${API_URL}/nz-trip/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchDriveTime',
        data: { fromLat, fromLng, toLat, toLng }
      })
    });
    const result = await response.json();

    if (result.success && result.driveTime !== null) {
      // Cache locally for this session
      localDriveTimeCache.set(routeKey, result.driveTime);
      return result.driveTime;
    }

    console.warn('Server drive time fetch failed:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to fetch drive time:', error);
    return null;
  }
}
