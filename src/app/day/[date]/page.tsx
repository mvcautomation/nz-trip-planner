'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import ActivityCard from '@/components/ActivityCard';
import WeatherWidget from '@/components/WeatherWidget';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { getTripDays, tripDates, Location } from '@/lib/tripData';
import AccommodationCard from '@/components/AccommodationCard';
import { getVisitedState, getNotesState, VisitedState, NotesState } from '@/lib/storage';

// Tolkien quotes for each day - themed for travel and adventure
const tolkienQuotes = [
  { quote: "Not all those who wander are lost.", source: "The Fellowship of the Ring" },
  { quote: "The Road goes ever on and on, down from the door where it began.", source: "The Fellowship of the Ring" },
  { quote: "It's a dangerous business, going out your door. You step onto the road, and if you don't keep your feet, there's no knowing where you might be swept off to.", source: "The Fellowship of the Ring" },
  { quote: "Little by little, one travels far.", source: "The Lord of the Rings" },
  { quote: "Even the smallest person can change the course of the future.", source: "The Fellowship of the Ring" },
  { quote: "All we have to decide is what to do with the time that is given us.", source: "The Fellowship of the Ring" },
  { quote: "Home is behind, the world ahead, and there are many paths to tread.", source: "The Fellowship of the Ring" },
  { quote: "I will not say: do not weep; for not all tears are an evil.", source: "The Return of the King" },
  { quote: "There is some good in this world, and it's worth fighting for.", source: "The Two Towers" },
  { quote: "May the wind under your wings bear you where the sun sails and the moon walks.", source: "The Hobbit" },
  { quote: "The world is indeed full of peril, and in it there are many dark places; but still there is much that is fair.", source: "The Fellowship of the Ring" },
];

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default function DayPage({ params }: DayPageProps) {
  const resolvedParams = use(params);
  const date = decodeURIComponent(resolvedParams.date);
  const [visitedState, setVisitedState] = useState<VisitedState>({});
  const [notesState, setNotesState] = useState<NotesState>({});

  const tripDays = getTripDays();
  const dayIndex = tripDates.findIndex((d) => d.date === date);
  const day = tripDays[dayIndex];
  const prevDay = dayIndex > 0 ? tripDays[dayIndex - 1] : null;
  const nextDay = dayIndex < tripDays.length - 1 ? tripDays[dayIndex + 1] : null;

  useEffect(() => {
    async function loadState() {
      const [visited, notes] = await Promise.all([
        getVisitedState(),
        getNotesState(),
      ]);
      setVisitedState(visited);
      setNotesState(notes);
    }
    loadState();
  }, []);

  if (!day) {
    return (
      <main className="page-with-bg">
        <div className="safe-bottom p-4 md:p-8 max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Day not found</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            Back to overview
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Get the previous location for drive time calculation
  const getPreviousLocation = (index: number): Location | undefined => {
    if (index === 0) {
      // First activity of the day - previous is the stay from yesterday or first activity yesterday
      if (prevDay?.stay) return prevDay.stay;
      if (prevDay?.activities.length) return prevDay.activities[prevDay.activities.length - 1];
      return undefined;
    }
    return day.activities[index - 1];
  };

  const handleVisitedChange = (id: string, visited: boolean) => {
    setVisitedState((prev) => ({ ...prev, [id]: visited }));
  };

  const handleNoteChange = (id: string, note: string) => {
    setNotesState((prev) => ({ ...prev, [id]: note }));
  };

  return (
    <main className="page-with-bg">
      <OfflineIndicator />
      <div className="safe-bottom p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-bold">{day.dateLabel}</h1>
              <p className="text-sm text-gray-400">
                {day.activities.length} activities
              </p>
            </div>
            <Link
              href={`/planner?date=${encodeURIComponent(date)}`}
              className="text-gray-400 hover:text-white transition-colors"
              title="Edit day"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>

          {/* Tolkien Quote */}
          <div className="tolkien-quote mb-6">
            <p className="quote-text">"{tolkienQuotes[dayIndex % tolkienQuotes.length].quote}"</p>
            <p className="quote-source">— J.R.R. Tolkien, {tolkienQuotes[dayIndex % tolkienQuotes.length].source}</p>
          </div>

          {/* Day navigation */}
          <div className="flex justify-between mb-6">
            {prevDay ? (
              <Link
                href={`/day/${encodeURIComponent(prevDay.date)}`}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← {prevDay.dateLabel.split(',')[1]}
              </Link>
            ) : (
              <div />
            )}
            {nextDay && (
              <Link
                href={`/day/${encodeURIComponent(nextDay.date)}`}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {nextDay.dateLabel.split(',')[1]} →
              </Link>
            )}
          </div>

          {/* Weather */}
          <div className="mb-6">
            <WeatherWidget date={date} />
          </div>

          {/* Activities */}
          <div className="space-y-3 mb-6">
            <h2 className="text-lg font-semibold">Activities</h2>
            {day.activities.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No activities scheduled for this day</p>
            ) : (
              day.activities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  previousActivity={getPreviousLocation(index)}
                  isVisited={visitedState[activity.id] || false}
                  note={notesState[activity.id]}
                  onVisitedChange={(visited) => handleVisitedChange(activity.id, visited)}
                  onNoteChange={(note) => handleNoteChange(activity.id, note)}
                />
              ))
            )}
          </div>

          {/* Overnight Stay */}
          {day.accommodation ? (
            <AccommodationCard
              accommodation={day.accommodation}
              legacyStayName={day.stay?.name}
            />
          ) : day.stay && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-300 uppercase tracking-wide">Overnight Stay</p>
                  <p className="font-medium">{day.stay.name}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${day.stay.lat},${day.stay.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-btn text-xs"
                >
                  Navigate
                </a>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Day Progress</span>
              <span className="text-gray-300">
                {day.activities.filter((a) => visitedState[a.id]).length}/{day.activities.length}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    day.activities.length > 0
                      ? (day.activities.filter((a) => visitedState[a.id]).length /
                          day.activities.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
