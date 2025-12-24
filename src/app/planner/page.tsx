'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { getTripDays, tripDates, Location, getDriveTime } from '@/lib/tripData';
import AccommodationCard from '@/components/AccommodationCard';
import { getDayPlans, setDayPlan, getCustomActivities, addCustomActivity, CustomActivity, getActivityEnrichments, setActivityEnrichment, ActivityEnrichments, pullFromServer } from '@/lib/storage';
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
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [orderedActivities, setOrderedActivities] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [showMapsInput, setShowMapsInput] = useState(false);
  const [mapsLink, setMapsLink] = useState('');
  const [mapsLinkError, setMapsLinkError] = useState('');
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [customActivities, setCustomActivities] = useState<CustomActivity[]>([]);
  const [activityEnrichments, setActivityEnrichmentsState] = useState<ActivityEnrichments>({});
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editMapsLink, setEditMapsLink] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOrderRef = useRef<string[]>([]);
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const draggedElement = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasSynced = useRef(false);

  const tripDays = getTripDays();

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

  // Load custom activities and enrichments
  useEffect(() => {
    async function loadCustomData() {
      // Sync from server once per page navigation
      if (!hasSynced.current) {
        hasSynced.current = true;
        await pullFromServer();
      }

      const [activities, enrichments] = await Promise.all([
        getCustomActivities(),
        getActivityEnrichments(),
      ]);
      setCustomActivities(activities);
      setActivityEnrichmentsState(enrichments);
    }
    loadCustomData();
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

  // Drag handlers (mouse)
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
    dragOrderRef.current = [...orderedActivities];
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    // Use the ref for the current order to avoid stale state
    const newOrder = [...dragOrderRef.current];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    dragOrderRef.current = newOrder;
    setOrderedActivities(newOrder);
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

  // Touch handlers (mobile)
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchCurrentY.current = touch.clientY;
    setDraggedIndex(index);
    dragOrderRef.current = [...orderedActivities];
    draggedElement.current = e.currentTarget as HTMLDivElement;

    // Add visual feedback
    if (draggedElement.current) {
      draggedElement.current.style.opacity = '0.8';
      draggedElement.current.style.transform = 'scale(1.02)';
      draggedElement.current.style.zIndex = '100';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null || !listContainerRef.current) return;

    e.preventDefault(); // Prevent scrolling while dragging

    const touch = e.touches[0];
    touchCurrentY.current = touch.clientY;

    // Find which item we're over
    const items = listContainerRef.current.querySelectorAll('[data-drag-index]');
    let targetIndex = draggedIndex;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemMiddle = rect.top + rect.height / 2;

      if (touch.clientY < itemMiddle && index < draggedIndex) {
        targetIndex = index;
      } else if (touch.clientY > itemMiddle && index > draggedIndex) {
        targetIndex = index;
      }
    });

    if (targetIndex !== draggedIndex) {
      const newOrder = [...dragOrderRef.current];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, removed);
      setOrderedActivities(newOrder);
      dragOrderRef.current = newOrder;
      setDraggedIndex(targetIndex);
    }
  };

  const handleTouchEnd = async () => {
    // Remove visual feedback
    if (draggedElement.current) {
      draggedElement.current.style.opacity = '';
      draggedElement.current.style.transform = '';
      draggedElement.current.style.zIndex = '';
    }
    draggedElement.current = null;

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

  // Edit activity enrichment
  const startEditing = (activityId: string) => {
    const enrichment = activityEnrichments[activityId] || {};
    setEditAddress(enrichment.address || '');
    setEditMapsLink(enrichment.mapsLink || '');
    setEditingActivity(activityId);
  };

  const saveEnrichment = async () => {
    if (!editingActivity) return;

    const enrichment = {
      address: editAddress.trim() || undefined,
      mapsLink: editMapsLink.trim() || undefined,
    };

    await setActivityEnrichment(editingActivity, enrichment);
    setActivityEnrichmentsState({
      ...activityEnrichments,
      [editingActivity]: enrichment,
    });
    setEditingActivity(null);
    setEditAddress('');
    setEditMapsLink('');
  };

  const cancelEditing = () => {
    setEditingActivity(null);
    setEditAddress('');
    setEditMapsLink('');
  };

  const viewDay = () => {
    if (selectedDate) {
      router.push(`/day/${encodeURIComponent(selectedDate)}`);
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
            <button
              onClick={viewDay}
              className="text-gray-400 hover:text-white transition-colors"
              title="View day"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
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
              <button
                onClick={() => setShowMapsInput(!showMapsInput)}
                className="text-sm text-gold hover:text-gold-light"
                style={{ color: 'var(--gold)' }}
              >
                + Add Activity
              </button>
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

            {/* Draggable list */}
            <div className="space-y-2" ref={listContainerRef}>
              {orderedActivities.map((activityId, index) => {
                const activity = getLocationById(activityId);
                if (!activity) return null;

                const prevActivityId = index > 0 ? orderedActivities[index - 1] : null;
                const driveTime = prevActivityId
                  ? getDriveTime(prevActivityId, activityId)
                  : null;

                const isCustom = customActivities.some((a) => a.id === activityId);

                return (
                  <div
                    key={activityId}
                    data-drag-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`activity-card draggable ${
                      draggedIndex === index ? 'dragging' : ''
                    } ${isCustom ? 'border-gold/30' : ''}`}
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
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: isCustom ? 'rgba(212, 168, 83, 0.3)' : 'var(--green-accent)' }}
                      >
                        {index + 1}
                      </div>

                      {/* Activity info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{activity.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                          <span>{estimatedTimes[index]}</span>
                          {driveTime && (
                            <>
                              <span>•</span>
                              <span>{formatDriveTime(driveTime)} drive</span>
                            </>
                          )}
                          {isCustom && (
                            <span style={{ color: 'var(--gold)' }}>(custom)</span>
                          )}
                        </div>
                        {/* Show enriched info if available */}
                        {activityEnrichments[activityId]?.address && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            📍 {activityEnrichments[activityId].address}
                          </p>
                        )}
                        {activityEnrichments[activityId]?.mapsLink && (
                          <a
                            href={activityEnrichments[activityId].mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🗺️ Open in Maps
                          </a>
                        )}
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(activityId)}
                        className="text-gray-500 hover:text-blue-400 transition-colors p-1"
                        title="Add address or maps link"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

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

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Edit: {getLocationById(editingActivity)?.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Enter address..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Google Maps Link</label>
                <input
                  type="text"
                  value={editMapsLink}
                  onChange={(e) => setEditMapsLink(e.target.value)}
                  placeholder="Paste Google Maps URL..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy the share link from Google Maps
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveEnrichment}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
