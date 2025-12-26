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

// Local memory cache for drive times
const localDriveTimeCache = new Map<string, number>();

// Routes that we've already tried to fetch and got no result (to prevent re-fetching)
const failedRoutes = new Set<string>();

// Flag to stop fetching when API limit is reached
let apiLimitReached = false;

// Single promise for loading the cache (ensures it only loads once)
let cacheLoadPromise: Promise<void> | null = null;

// Load cache from IndexedDB (called once, returns same promise if already loading)
async function ensureCacheLoaded(): Promise<void> {
  if (cacheLoadPromise) {
    return cacheLoadPromise;
  }

  cacheLoadPromise = (async () => {
    try {
      const { getCachedDriveTimes } = await import('./storage');
      const cachedTimes = await getCachedDriveTimes();
      for (const [key, value] of Object.entries(cachedTimes)) {
        localDriveTimeCache.set(key, value);
      }
    } catch (e) {
      console.warn('Failed to load cached drive times:', e);
    }
  })();

  return cacheLoadPromise;
}

// Get drive time from cache only (no server fetch)
export function getCachedDriveTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number | null {
  const routeKey = `${fromLat},${fromLng}->${toLat},${toLng}`;
  return localDriveTimeCache.get(routeKey) ?? null;
}

// Preload all drive times from IndexedDB into memory
// Call this once when the app/page loads, BEFORE rendering ActivityCards
export async function preloadDriveTimes(): Promise<void> {
  await ensureCacheLoaded();
}

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<number | null>>();

// Get drive time between two coordinates
// First checks memory cache, then fetches from server if needed
export async function fetchDriveTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const routeKey = `${fromLat},${fromLng}->${toLat},${toLng}`;

  // Wait for cache to load first (this is the key fix - wait for it to complete!)
  await ensureCacheLoaded();

  // Check local memory cache
  if (localDriveTimeCache.has(routeKey)) {
    return localDriveTimeCache.get(routeKey)!;
  }

  // Don't retry routes that already failed
  if (failedRoutes.has(routeKey)) {
    return null;
  }

  // Don't make new requests if API limit was reached
  if (apiLimitReached) {
    return null;
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

      // Check if API limit was reached - stop all future requests this session
      // Don't add to failedRoutes so it can be retried after page reload (next day)
      if (result.limitReached) {
        apiLimitReached = true;
        return null;
      }

      if (result.success && result.driveTime !== null) {
        localDriveTimeCache.set(routeKey, result.driveTime);
        return result.driveTime;
      }

      // Mark this route as failed so we don't retry
      failedRoutes.add(routeKey);
      return null;
    } catch (error) {
      console.error('Failed to fetch drive time:', error);
      failedRoutes.add(routeKey);
      return null;
    } finally {
      pendingRequests.delete(routeKey);
    }
  })();

  pendingRequests.set(routeKey, requestPromise);
  return requestPromise;
}
