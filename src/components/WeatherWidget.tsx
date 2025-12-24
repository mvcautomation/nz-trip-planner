'use client';

import { useEffect, useState } from 'react';
import { fetchWeather, getWeatherDescription, WeatherData } from '@/lib/weather';

interface WeatherWidgetProps {
  date: string; // Format: "12/30" or "1/5"
}

function getWeatherEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export default function WeatherWidget({ date }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      const data = await fetchWeather();
      setWeather(data);
      setLoading(false);
    }
    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  // Convert date format "12/30" or "1/5" to "2025-12-30" or "2026-01-05"
  const [month, day] = date.split('/').map(Number);
  const year = month === 12 ? 2025 : 2026;
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const dayWeather = weather.daily.find((d) => d.date === dateStr);

  if (!dayWeather) {
    return null;
  }

  const maxF = Math.round(dayWeather.maxTemp * 9/5 + 32);
  const minF = Math.round(dayWeather.minTemp * 9/5 + 32);

  // Convert mm to inches
  const precipInches = dayWeather.precipitationMm ? (dayWeather.precipitationMm / 25.4).toFixed(2) : null;

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-3xl" role="img" aria-label={getWeatherDescription(dayWeather.weatherCode)}>
          {getWeatherEmoji(dayWeather.weatherCode)}
        </span>
        <div>
          <p className="text-xs text-gray-400">{getWeatherDescription(dayWeather.weatherCode)}</p>
          <p className="font-semibold">
            {maxF}° / {minF}°F
            <span className="text-xs text-gray-500 ml-1">
              ({dayWeather.maxTemp}°/{dayWeather.minTemp}°C)
            </span>
          </p>
          {dayWeather.precipitationChance > 20 && (
            <p className="text-xs text-blue-300">
              💧 {dayWeather.precipitationChance}%
              {precipInches && parseFloat(precipInches) > 0 && (
                <span className="ml-1">({precipInches}&quot;)</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
