import { get, set, del, keys } from 'idb-keyval';

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

// Visited locations
export async function getVisitedState(): Promise<VisitedState> {
  return (await get(VISITED_KEY)) || {};
}

export async function setVisited(locationId: string, visited: boolean): Promise<void> {
  const state = await getVisitedState();
  state[locationId] = visited;
  await set(VISITED_KEY, state);
}

export async function toggleVisited(locationId: string): Promise<boolean> {
  const state = await getVisitedState();
  const newValue = !state[locationId];
  state[locationId] = newValue;
  await set(VISITED_KEY, state);
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
}

// Day plans
export async function getDayPlans(): Promise<Record<string, DayPlan>> {
  return (await get(DAY_PLANS_KEY)) || {};
}

export async function setDayPlan(plan: DayPlan): Promise<void> {
  const plans = await getDayPlans();
  plans[plan.date] = plan;
  await set(DAY_PLANS_KEY, plans);
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
    weatherCode: number;
  }[];
}

export async function getCachedWeather(): Promise<WeatherCache | null> {
  return (await get(WEATHER_CACHE_KEY)) || null;
}

export async function setCachedWeather(data: WeatherData): Promise<void> {
  await set(WEATHER_CACHE_KEY, { data, timestamp: Date.now() });
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await del(VISITED_KEY);
  await del(NOTES_KEY);
  await del(DAY_PLANS_KEY);
  await del(WEATHER_CACHE_KEY);
}
