import { get, set, del } from 'idb-keyval';

export interface VisitedState {
  [locationId: string]: boolean;
}

export interface NotesState {
  [locationId: string]: string;
}

export interface DayPlan {
  date: string;
  orderedActivities: string[]; // Array of location IDs
  departureTime?: string; // HH:MM format
}

const VISITED_KEY = 'nz-trip-visited';
const NOTES_KEY = 'nz-trip-notes';
const DAY_PLANS_KEY = 'nz-trip-day-plans';
const WEATHER_CACHE_KEY = 'nz-trip-weather-cache';
const CUSTOM_ACTIVITIES_KEY = 'nz-trip-custom-activities';
const ACTIVITY_ENRICHMENTS_KEY = 'nz-trip-activity-enrichments';
const LAST_SYNC_KEY = 'nz-trip-last-sync';

// Sync server URL - uses webhook server for cross-device sync
const SYNC_SERVER_URL = 'https://webhooks.ai-app.space/nz-trip/sync';

// Custom activities added by user (from Google Maps links)
// Extends Location interface for compatibility
export interface CustomActivity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date: string;  // The trip date it was added to
  category: 'custom';  // Mark as custom type
  address?: string;
}

// Sync helper - fire and forget to server
async function syncToServer(action: string, data: unknown): Promise<void> {
  try {
    await fetch(SYNC_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data }),
    });
  } catch (error) {
    // Silently fail - local storage is the source of truth
    console.warn('Failed to sync to server:', error);
  }
}

// Visited locations
export async function getVisitedState(): Promise<VisitedState> {
  return (await get(VISITED_KEY)) || {};
}

export async function setVisited(locationId: string, visited: boolean): Promise<void> {
  const state = await getVisitedState();
  state[locationId] = visited;
  await set(VISITED_KEY, state);
  syncToServer('setVisited', { locationId, visited });
}

export async function toggleVisited(locationId: string): Promise<boolean> {
  const state = await getVisitedState();
  const newValue = !state[locationId];
  state[locationId] = newValue;
  await set(VISITED_KEY, state);
  syncToServer('setVisited', { locationId, visited: newValue });
  return newValue;
}

// Notes
export async function getNotesState(): Promise<NotesState> {
  return (await get(NOTES_KEY)) || {};
}

export async function setNote(locationId: string, note: string): Promise<void> {
  const state = await getNotesState();
  state[locationId] = note;
  await set(NOTES_KEY, state);
  syncToServer('setNote', { locationId, note });
}

// Day plans
export async function getDayPlans(): Promise<Record<string, DayPlan>> {
  return (await get(DAY_PLANS_KEY)) || {};
}

export async function setDayPlan(plan: DayPlan): Promise<void> {
  const plans = await getDayPlans();
  plans[plan.date] = plan;
  await set(DAY_PLANS_KEY, plans);
  syncToServer('setDayPlan', plan);
}

// Weather cache
export interface WeatherCache {
  data: WeatherData;
  timestamp: number;
}

export interface WeatherData {
  daily: {
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitationChance: number;
    precipitationMm?: number;
    weatherCode: number;
  }[];
}

export async function getCachedWeather(): Promise<WeatherCache | null> {
  return (await get(WEATHER_CACHE_KEY)) || null;
}

export async function setCachedWeather(data: WeatherData): Promise<void> {
  await set(WEATHER_CACHE_KEY, { data, timestamp: Date.now() });
}

export async function clearWeatherCache(): Promise<void> {
  await del(WEATHER_CACHE_KEY);
}

// Custom activities
export async function getCustomActivities(): Promise<CustomActivity[]> {
  return (await get(CUSTOM_ACTIVITIES_KEY)) || [];
}

export async function addCustomActivity(activity: CustomActivity): Promise<void> {
  const activities = await getCustomActivities();
  activities.push(activity);
  await set(CUSTOM_ACTIVITIES_KEY, activities);
  // Sync without category field (server doesn't need it)
  const { category, ...activityData } = activity;
  syncToServer('addCustomActivity', activityData);
}

export async function removeCustomActivity(activityId: string): Promise<void> {
  const activities = await getCustomActivities();
  const filtered = activities.filter(a => a.id !== activityId);
  await set(CUSTOM_ACTIVITIES_KEY, filtered);
  syncToServer('removeCustomActivity', { activityId });
}

// Activity enrichments - additional info for any activity (address, maps link, etc.)
export interface ActivityEnrichment {
  address?: string;
  mapsLink?: string;
}

export interface ActivityEnrichments {
  [activityId: string]: ActivityEnrichment;
}

export async function getActivityEnrichments(): Promise<ActivityEnrichments> {
  return (await get(ACTIVITY_ENRICHMENTS_KEY)) || {};
}

export async function setActivityEnrichment(activityId: string, enrichment: ActivityEnrichment): Promise<void> {
  const enrichments = await getActivityEnrichments();
  enrichments[activityId] = enrichment;
  await set(ACTIVITY_ENRICHMENTS_KEY, enrichments);
  syncToServer('setActivityEnrichment', { activityId, enrichment });
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await del(VISITED_KEY);
  await del(NOTES_KEY);
  await del(DAY_PLANS_KEY);
  await del(WEATHER_CACHE_KEY);
  await del(CUSTOM_ACTIVITIES_KEY);
  await del(ACTIVITY_ENRICHMENTS_KEY);
  await del(LAST_SYNC_KEY);
}

// Sync functions for cross-device data sharing

// Pull data from server and merge with local (server wins for conflicts)
export async function pullFromServer(): Promise<boolean> {
  try {
    const response = await fetch(SYNC_SERVER_URL);
    if (!response.ok) return false;

    const serverData = await response.json();

    // Merge visited state (server wins)
    if (serverData.visited && Object.keys(serverData.visited).length > 0) {
      const localVisited = await getVisitedState();
      const merged = { ...localVisited, ...serverData.visited };
      await set(VISITED_KEY, merged);
    }

    // Merge notes (server wins)
    if (serverData.notes && Object.keys(serverData.notes).length > 0) {
      const localNotes = await getNotesState();
      const merged = { ...localNotes, ...serverData.notes };
      await set(NOTES_KEY, merged);
    }

    // Merge day plans (server wins)
    if (serverData.dayPlans && Object.keys(serverData.dayPlans).length > 0) {
      const localPlans = await getDayPlans();
      const merged = { ...localPlans, ...serverData.dayPlans };
      await set(DAY_PLANS_KEY, merged);
    }

    // Merge custom activities (server wins, merge by id)
    if (serverData.customActivities && serverData.customActivities.length > 0) {
      const localActivities = await getCustomActivities();
      const activityMap = new Map<string, CustomActivity>();

      // Add local first
      for (const activity of localActivities) {
        activityMap.set(activity.id, activity);
      }

      // Server overwrites
      for (const activity of serverData.customActivities) {
        activityMap.set(activity.id, { ...activity, category: 'custom' as const });
      }

      await set(CUSTOM_ACTIVITIES_KEY, Array.from(activityMap.values()));
    }

    // Merge activity enrichments (server wins)
    if (serverData.activityEnrichments && Object.keys(serverData.activityEnrichments).length > 0) {
      const localEnrichments = await getActivityEnrichments();
      const merged = { ...localEnrichments, ...serverData.activityEnrichments };
      await set(ACTIVITY_ENRICHMENTS_KEY, merged);
    }

    await set(LAST_SYNC_KEY, Date.now());
    return true;
  } catch (error) {
    console.warn('Failed to pull from server:', error);
    return false;
  }
}

// Push all local data to server (initial sync)
export async function pushToServer(): Promise<boolean> {
  try {
    const [visited, notes, dayPlans, customActivities, activityEnrichments] = await Promise.all([
      getVisitedState(),
      getNotesState(),
      getDayPlans(),
      getCustomActivities(),
      getActivityEnrichments(),
    ]);

    // Remove category from custom activities for server
    const serverActivities = customActivities.map(({ category, ...rest }) => rest);

    const response = await fetch(SYNC_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'import',
        data: {
          visited,
          notes,
          dayPlans,
          customActivities: serverActivities,
          activityEnrichments,
        },
      }),
    });

    if (response.ok) {
      await set(LAST_SYNC_KEY, Date.now());
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to push to server:', error);
    return false;
  }
}

// Get last sync timestamp
export async function getLastSync(): Promise<number | null> {
  return (await get(LAST_SYNC_KEY)) || null;
}

// Full sync - pull then push any local-only changes
export async function fullSync(): Promise<boolean> {
  const pullSuccess = await pullFromServer();
  if (pullSuccess) {
    await pushToServer();
  }
  return pullSuccess;
}
