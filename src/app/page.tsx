'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/hero/HeroSection';
import DayCard from '@/components/DayCard';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { getTripDays, tripDates } from '@/lib/tripData';
import { getVisitedState, VisitedState } from '@/lib/storage';

export default function Home() {
  const [visitedState, setVisitedState] = useState<VisitedState>({});
  const tripDays = getTripDays();

  useEffect(() => {
    async function loadVisited() {
      const state = await getVisitedState();
      setVisitedState(state);
    }
    loadVisited();
  }, []);

  // Determine current day
  const today = new Date();
  const getCurrentDayIndex = () => {
    for (let i = 0; i < tripDates.length; i++) {
      const tripDate = tripDates[i].fullDate;
      if (
        today.getFullYear() === tripDate.getFullYear() &&
        today.getMonth() === tripDate.getMonth() &&
        today.getDate() === tripDate.getDate()
      ) {
        return i;
      }
    }
    // If before trip, return -1; if after, return length
    if (today < tripDates[0].fullDate) return -1;
    return tripDates.length;
  };

  const currentDayIndex = getCurrentDayIndex();

  // Calculate stats
  const totalActivities = tripDays.reduce((sum, day) => sum + day.activities.length, 0);
  const visitedCount = Object.values(visitedState).filter(Boolean).length;
  const daysRemaining = Math.max(0, tripDates.length - currentDayIndex);

  return (
    <main>
      <OfflineIndicator />
      <HeroSection />

      <section className="dashboard safe-bottom" id="dashboard">
        <div className="max-w-4xl mx-auto">
          {/* Stats Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-[var(--cream)]">Trip Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-card rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--gold)]">{tripDates.length}</p>
                <p className="text-xs text-[var(--brown-warm)]">Days</p>
              </div>
              <div className="stat-card rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--green-accent)]">{visitedCount}/{totalActivities}</p>
                <p className="text-xs text-[var(--brown-warm)]">Activities</p>
              </div>
              <div className="stat-card rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--gold-light)]">{daysRemaining}</p>
                <p className="text-xs text-[var(--brown-warm)]">Days Left</p>
              </div>
            </div>
          </div>

          {/* Trip Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--brown-warm)]">Trip Progress</span>
              <span className="text-[var(--cream)]">
                {Math.round((visitedCount / totalActivities) * 100) || 0}%
              </span>
            </div>
            <div className="h-2 bg-[var(--brown)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(visitedCount / totalActivities) * 100 || 0}%`,
                  background: 'linear-gradient(90deg, var(--green-accent) 0%, var(--gold) 100%)'
                }}
              />
            </div>
          </div>

          {/* Calendar Grid */}
          <h3 className="text-lg font-semibold mb-3 text-[var(--cream)]">Daily Schedule</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tripDays.map((day, index) => {
              const dayVisitedCount = day.activities.filter(
                (a) => visitedState[a.id]
              ).length;

              return (
                <DayCard
                  key={day.date}
                  day={day}
                  isCurrentDay={index === currentDayIndex}
                  isPast={index < currentDayIndex}
                  visitedCount={dayVisitedCount}
                  totalActivities={day.activities.length}
                />
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <a
              href="/planner"
              className="quick-link-planner rounded-lg p-4 text-center transition-all"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-[var(--cream)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-[var(--cream)]">Plan Tomorrow</span>
            </a>
            <a
              href="/emergency"
              className="quick-link-emergency rounded-lg p-4 text-center transition-all"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-[var(--gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium text-[var(--gold)]">Emergency Info</span>
            </a>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
