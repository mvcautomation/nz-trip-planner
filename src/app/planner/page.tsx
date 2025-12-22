'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { getTripDays, getPossibleActivities, tripDates, Location, getDriveTime } from '@/lib/tripData';
import AccommodationCard from '@/components/AccommodationCard';
import { getDayPlans, setDayPlan, getCustomActivities, addCustomActivity, CustomActivity } from '@/lib/storage';
import WeatherWidget from '@/components/WeatherWidget';
import { formatDriveTime } from '@/lib/maps';

// Wrap in Suspense for useSearchParams
export default function PlannerPage() {
  return (
    <Suspense fallback={<PlannerLoading />}>
      <PlannerContent />
    </Suspense>
  );
}

function PlannerLoading() {
  return (
    <main className="page-with-bg">
      <div className="safe-bottom p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto mb-6"></div>
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
            <div className="h-24 bg-gray-700 rounded mb-6"></div>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [orderedActivities, setOrderedActivities] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [showPossible, setShowPossible] = useState(false);
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsLink, setMapsLink] = useState('');
  const [mapsLinkError, setMapsLinkError] = useState('');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOrderRef = useRef<string[]>([]);

  const tripDays = getTripDays();
  const possibleActivities = getPossibleActivities();

  // Get the day data for the selected date
  const selectedDay = tripDays.find((d) => d.date === selectedDate);

  // Initialize with the date from URL param or first future day
  useEffect(() => {
    const dateParam = searchParams.get('date');

    if (dateParam) {
      // Use the date from URL parameter
      const decodedDate = decodeURIComponent(dateParam);
      const validDate = tripDates.find(d => d.date === decodedDate);
      if (validDate) {
        setSelectedDate(decodedDate);
        return;
      }
    }

    // Default: find the first future day
    const today = new Date();
    let targetIndex = 0;

    for (let i = 0; i < tripDates.length; i++) {
      const tripDate = tripDates[i].fullDate;
      if (tripDate >= today) {
        targetIndex = i;
        break;
      }
    }

    // Select tomorrow if today is during the trip
    if (targetIndex < tripDates.length - 1) {
      targetIndex = Math.min(targetIndex + 1, tripDates.length - 1);
    }

    setSelectedDate(tripDates[targetIndex].date);
  }, [searchParams]);

  // Load custom activities
  useEffect(() => {
    async function loadCustomActivities() {
      const activities = await getCustomActivities();
      setCustomActivities(activities);
    }
    loadCustomActivities();
  }, []);

  // Load saved plan for selected date
  useEffect(() => {
    async function loadPlan() {
      if (!selectedDate || !selectedDay) return;

      const plans = await getDayPlans();
      const plan = plans[selectedDate];

      if (plan) {
        setOrderedActivities(plan.orderedActivities);
        setDepartureTime(plan.departureTime || '08:00');
      } else {
        // Default to the order from trip data
        setOrderedActivities(selectedDay.activities.map((a) => a.id));
      }
    }
    loadPlan();
  }, [selectedDate, selectedDay]);

  // Get location by ID (includes custom activities)
  const getLocationById = (id: string): Location | undefined => {
    return (
      selectedDay?.activities.find((a) => a.id === id) ||
      possibleActivities.find((a) => a.id === id) ||
      customActivities.find((a) => a.id === id)
    );
  };

  // Parse Google Maps share link to extract place info
  const parseGoogleMapsLink = async (link: string): Promise<{ name: string; lat: number; lng: number; address?: string } | null> => {
    try {
      let url = link.trim();

      // For short links (maps.app.goo.gl), use our API to resolve
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        try {
          const response = await fetch('/api/resolve-maps-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            const error = await response.json();
            setMapsLinkError(error.error || 'Failed to resolve the link');
            return null;
          }

          const data = await response.json();
          return { name: data.name, lat: data.lat, lng: data.lng };
        } catch {
          setMapsLinkError('Failed to process the link. Please try again.');
          return null;
        }
      }

      // For full Google Maps URLs, parse directly
      // Extract coordinates from URL
      // Format: /place/Name/@-lat,lng,zoom or just @lat,lng
      const pathMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (!pathMatch) {
        setMapsLinkError('Could not find coordinates in the link. Please try copying the URL again.');
        return null;
      }

      const lat = parseFloat(pathMatch[1]);
      const lng = parseFloat(pathMatch[2]);

      // Try to extract place name from URL
      const placeMatch = url.match(/\/place\/([^/@]+)/);
      let name = 'Custom Location';
      if (placeMatch) {
        name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }

      return { name, lat, lng };
    } catch {
      setMapsLinkError('Invalid Google Maps link. Please paste a valid URL.');
      return null;
    }
  };

  // Handle adding activity from Google Maps link
  const handleAddFromMapsLink = async () => {
    if (!mapsLink.trim()) {
      setMapsLinkError('Please enter a Google Maps link');
      return;
    }

    setIsLoadingLink(true);
    setMapsLinkError('');

    const placeInfo = await parseGoogleMapsLink(mapsLink);

    if (placeInfo) {
      // Create a custom activity
      const newActivity: CustomActivity = {
        id: `custom-${Date.now()}`,
        name: placeInfo.name,
        lat: placeInfo.lat,
        lng: placeInfo.lng,
        date: selectedDate,
        category: 'custom',
        address: placeInfo.address,
      };

      await addCustomActivity(newActivity);
      setCustomActivities([...customActivities, newActivity]);

      // Add to ordered activities
      const newOrdered = [...orderedActivities, newActivity.id];
      setOrderedActivities(newOrdered);
      await setDayPlan({
        date: selectedDate,
        orderedActivities: newOrdered,
        departureTime,
      });

      // Reset form
      setMapsLink('');
      setShowMapsInput(false);
    }

    setIsLoadingLink(false);
  };

  // Calculate estimated times
  const getEstimatedTimes = () => {
    const times: string[] = [];
    let currentMinutes = parseInt(departureTime.split(':')[0]) * 60 + parseInt(departureTime.split(':')[1]);

    for (let i = 0; i < orderedActivities.length; i++) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      times.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);

      // Add drive time to next location (estimated 1 hour per activity + drive)
      if (i < orderedActivities.length - 1) {
        const driveTime = getDriveTime(orderedActivities[i], orderedActivities[i + 1]) || 30;
        currentMinutes += 60 + driveTime; // 1 hour at activity + drive time
      }
    }

    return times;
  };

  const estimatedTimes = getEstimatedTimes();

  // Drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    dragOrderRef.current = [...orderedActivities];
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedActivities];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    setOrderedActivities(newOrder);
    dragOrderRef.current = newOrder;
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    // Save using the ref which has the latest order
    if (selectedDate && dragOrderRef.current.length > 0) {
      await setDayPlan({
        date: selectedDate,
        orderedActivities: dragOrderRef.current,
        departureTime,
      });
    }
  };

  // Add possible activity
  const addActivity = async (activityId: string) => {
    if (!orderedActivities.includes(activityId)) {
      const newOrder = [...orderedActivities, activityId];
      setOrderedActivities(newOrder);
      if (selectedDate) {
        await setDayPlan({
          date: selectedDate,
          orderedActivities: newOrder,
          departureTime,
        });
      }
    }
    setShowPossible(false);
  };

  // Remove activity
  const removeActivity = async (activityId: string) => {
    const newOrder = orderedActivities.filter((id) => id !== activityId);
    setOrderedActivities(newOrder);
    if (selectedDate) {
      await setDayPlan({
        date: selectedDate,
        orderedActivities: newOrder,
        departureTime,
      });
    }
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
            <h1 className="text-xl font-bold">Day Planner</h1>
            <div className="w-6" />
          </div>

          {/* Date selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Select Day to Plan</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            >
              {tripDays.map((day) => (
                <option key={day.date} value={day.date}>
                  {day.dateLabel} - {day.activities.length} activities
                </option>
              ))}
            </select>
          </div>

          {/* Weather for selected day */}
          {selectedDate && (
            <div className="mb-6">
              <WeatherWidget date={selectedDate} />
            </div>
          )}

          {/* Departure time */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={async (e) => {
                const newTime = e.target.value;
                setDepartureTime(newTime);
                if (selectedDate) {
                  await setDayPlan({
                    date: selectedDate,
                    orderedActivities,
                    departureTime: newTime,
                  });
                }
              }}
              className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Activities list */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Activity Order</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMapsInput(!showMapsInput);
                    setShowPossible(false);
                  }}
                  className="text-sm text-gold hover:text-gold-light"
                  style={{ color: 'var(--gold)' }}
                >
                  + Maps Link
                </button>
                <button
                  onClick={() => {
                    setShowPossible(!showPossible);
                    setShowMapsInput(false);
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Preset
                </button>
              </div>
            </div>

            {/* Google Maps link input */}
            {showMapsInput && (
              <div className="mb-4 bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-2">Add from Google Maps link:</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={mapsLink}
                    onChange={(e) => {
                      setMapsLink(e.target.value);
                      setMapsLinkError('');
                    }}
                    placeholder="Paste Google Maps URL here..."
                    className="maps-link-input"
                  />
                  {mapsLinkError && (
                    <p className="text-sm text-red-400">{mapsLinkError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddFromMapsLink}
                      disabled={isLoadingLink}
                      className="px-4 py-2 bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-colors disabled:opacity-50"
                      style={{ color: 'var(--gold)', borderColor: 'rgba(212, 168, 83, 0.4)' }}
                    >
                      {isLoadingLink ? 'Adding...' : 'Add Location'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMapsInput(false);
                        setMapsLink('');
                        setMapsLinkError('');
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: In Google Maps, find a place, tap Share, then copy the link
                  </p>
                </div>
              </div>
            )}

            {/* Possible activities dropdown */}
            {showPossible && (
              <div className="mb-4 bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-2">Add from preset activities:</p>
                <div className="space-y-2">
                  {possibleActivities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => addActivity(activity.id)}
                      disabled={orderedActivities.includes(activity.id)}
                      className="w-full text-left p-2 rounded bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {activity.name}
                      {orderedActivities.includes(activity.id) && (
                        <span className="text-xs text-gray-400 ml-2">(added)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Draggable list */}
            <div className="space-y-2">
              {orderedActivities.map((activityId, index) => {
                const activity = getLocationById(activityId);
                if (!activity) return null;

                const prevActivityId = index > 0 ? orderedActivities[index - 1] : null;
                const driveTime = prevActivityId
                  ? getDriveTime(prevActivityId, activityId)
                  : null;

                const isPossible = possibleActivities.some((a) => a.id === activityId);
                const isCustom = customActivities.some((a) => a.id === activityId);

                return (
                  <div
                    key={activityId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`activity-card draggable ${
                      draggedIndex === index ? 'dragging' : ''
                    } ${isPossible ? 'border-yellow-500/30' : ''} ${isCustom ? 'border-gold/30' : ''}`}
                    style={isCustom ? { borderColor: 'rgba(212, 168, 83, 0.3)' } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div className="text-gray-500 cursor-grab active:cursor-grabbing">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                        </svg>
                      </div>

                      {/* Order number */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCustom ? 'bg-gold/30' : 'bg-blue-600'}`} style={isCustom ? { backgroundColor: 'rgba(212, 168, 83, 0.3)' } : undefined}>
                        {index + 1}
                      </div>

                      {/* Activity info */}
                      <div className="flex-1">
                        <p className="font-medium">{activity.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{estimatedTimes[index]}</span>
                          {driveTime && (
                            <>
                              <span>•</span>
                              <span>{formatDriveTime(driveTime)} drive</span>
                            </>
                          )}
                          {isPossible && (
                            <span className="text-yellow-400">(optional)</span>
                          )}
                          {isCustom && (
                            <span style={{ color: 'var(--gold)' }}>(custom)</span>
                          )}
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeActivity(activityId)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {orderedActivities.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                No activities for this day. Add some from the possible activities!
              </p>
            )}
          </div>

          {/* Overnight stay info */}
          {selectedDay?.accommodation ? (
            <AccommodationCard
              accommodation={selectedDay.accommodation}
              legacyStayName={selectedDay.stay?.name}
            />
          ) : selectedDay?.stay && (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <p className="text-xs text-purple-300 uppercase tracking-wide mb-1">
                Overnight Stay
              </p>
              <p className="font-medium">{selectedDay.stay.name}</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
