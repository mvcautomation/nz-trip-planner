'use client';

import Link from 'next/link';
import { TripDay } from '@/lib/tripData';

interface DayCardProps {
  day: TripDay;
  isCurrentDay: boolean;
  isPast: boolean;
  visitedCount: number;
  totalActivities: number;
}

export default function DayCard({
  day,
  isCurrentDay,
  isPast,
  visitedCount,
  totalActivities,
}: DayCardProps) {
  const statusClass = isCurrentDay ? 'current' : isPast ? 'past' : '';

  return (
    <Link href={`/day/${encodeURIComponent(day.date)}`}>
      <div className={`day-card ${statusClass}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {day.dateLabel.split(',')[0]}
            </p>
            <p className="text-lg font-semibold">
              {day.dateLabel.split(',')[1]}
            </p>
          </div>
          {isCurrentDay && (
            <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-gray-300">
            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
          </p>
          {day.stay && (
            <p className="text-xs text-gray-400">
              Stay: {day.stay.name}
            </p>
          )}
        </div>

        {totalActivities > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Progress</span>
              <span className="text-gray-300">
                {visitedCount}/{totalActivities}
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(visitedCount / totalActivities) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
