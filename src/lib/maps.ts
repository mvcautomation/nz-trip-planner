export function getGoogleMapsDirectionsUrl(lat?: number, lng?: number, name?: string, address?: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  // Fall back to searching by name/address
  const query = address || name || '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function getGoogleMapsSearchUrl(lat?: number, lng?: number, name?: string, address?: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  // Fall back to searching by name/address
  const query = address || name || '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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

// Local memory cache for drive times (to avoid repeated calls in same session)
const localDriveTimeCache = new Map<string, number>();

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<number | null>>();

// IndexedDB cache loaded flag
let indexedDBCacheLoaded = false;

// Get drive time between two coordinates
// First checks memory cache, then IndexedDB (synced from server), then fetches from server if needed
export async function fetchDriveTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const routeKey = `${fromLat},${fromLng}->${toLat},${toLng}`;

  // Check local memory cache first
  if (localDriveTimeCache.has(routeKey)) {
    return localDriveTimeCache.get(routeKey)!;
  }

  // Load IndexedDB cache once into memory
  if (!indexedDBCacheLoaded) {
    indexedDBCacheLoaded = true;
    try {
      const { getCachedDriveTimes } = await import('./storage');
      const cachedTimes = await getCachedDriveTimes();
      for (const [key, value] of Object.entries(cachedTimes)) {
        localDriveTimeCache.set(key, value);
      }
    } catch (e) {
      console.warn('Failed to load cached drive times:', e);
    }
  }

  // Check memory cache again after loading IndexedDB
  if (localDriveTimeCache.has(routeKey)) {
    return localDriveTimeCache.get(routeKey)!;
  }

  // Check if there's already a pending request for this route
  if (pendingRequests.has(routeKey)) {
    return pendingRequests.get(routeKey)!;
  }

  // Not in cache - fetch from server (which will call Google API if needed)
  const API_URL = process.env.NEXT_PUBLIC_SYNC_API_URL || 'https://webhooks.ai-app.space';

  const requestPromise = (async (): Promise<number | null> => {
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
        localDriveTimeCache.set(routeKey, result.driveTime);
        return result.driveTime;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch drive time:', error);
      return null;
    } finally {
      pendingRequests.delete(routeKey);
    }
  })();

  pendingRequests.set(routeKey, requestPromise);
  return requestPromise;
}
