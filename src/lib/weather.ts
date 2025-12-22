import { getCachedWeather, setCachedWeather, WeatherData } from './storage';

export type { WeatherData };

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Weather codes from Open-Meteo
export const weatherDescriptions: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'sun' },
  1: { description: 'Mainly clear', icon: 'sun' },
  2: { description: 'Partly cloudy', icon: 'cloud-sun' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Fog', icon: 'smog' },
  48: { description: 'Depositing rime fog', icon: 'smog' },
  51: { description: 'Light drizzle', icon: 'cloud-rain' },
  53: { description: 'Moderate drizzle', icon: 'cloud-rain' },
  55: { description: 'Dense drizzle', icon: 'cloud-rain' },
  61: { description: 'Slight rain', icon: 'cloud-rain' },
  63: { description: 'Moderate rain', icon: 'cloud-showers-heavy' },
  65: { description: 'Heavy rain', icon: 'cloud-showers-heavy' },
  71: { description: 'Slight snow', icon: 'snowflake' },
  73: { description: 'Moderate snow', icon: 'snowflake' },
  75: { description: 'Heavy snow', icon: 'snowflake' },
  80: { description: 'Slight rain showers', icon: 'cloud-sun-rain' },
  81: { description: 'Moderate rain showers', icon: 'cloud-showers-heavy' },
  82: { description: 'Violent rain showers', icon: 'cloud-showers-heavy' },
  95: { description: 'Thunderstorm', icon: 'bolt' },
};

export function getWeatherIcon(code: number): string {
  return weatherDescriptions[code]?.icon || 'question';
}

export function getWeatherDescription(code: number): string {
  return weatherDescriptions[code]?.description || 'Unknown';
}

// Fetch weather for New Zealand South Island (central point around Queenstown area)
// We use a central location and the forecast covers the general region
export async function fetchWeather(forceRefresh = false): Promise<WeatherData | null> {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getCachedWeather();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    // Central NZ point for general forecast
    const lat = -42.5;
    const lng = 171.5;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Pacific%2FAuckland&forecast_days=14`
    );

    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      daily: data.daily.time.map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        precipitationChance: data.daily.precipitation_probability_max[i],
        weatherCode: data.daily.weather_code[i],
      })),
    };

    await setCachedWeather(weatherData);
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    // Return cached data if available, even if stale
    const cached = await getCachedWeather();
    return cached?.data || null;
  }
}
