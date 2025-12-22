'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import OfflineIndicator from '@/components/OfflineIndicator';
import { getTripDays, getPossibleActivities, tripDates, Location, getDriveTime } from '@/lib/tripData';
import { getDayPlans, setDayPlan, DayPlan } from '@/lib/storage';
import { formatDriveTime } from '@/lib/maps';

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [orderedActivities, setOrderedActivities] = useState<string[]>([]);
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [showPossible, setShowPossible] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const tripDays = getTripDays();
  const possibleActivities = getPossibleActivities();

  // Get the day data for the selected date
  const selectedDay = tripDays.find((d) => d.date === selectedDate);

  // Initialize with the first future day or first day
  useEffect(() => {
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

  // Save plan when activities change
  const savePlan = async () => {
    if (!selectedDate) return;
    await setDayPlan({
      date: selectedDate,
      orderedActivities,
      departureTime,
    });
  };

  // Get location by ID
  const getLocationById = (id: string): Location | undefined => {
    return (
      selectedDay?.activities.find((a) => a.id === id) ||
      possibleActivities.find((a) => a.id === id)
    );
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
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedActivities];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, removed);
    setOrderedActivities(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    savePlan();
  };

  // Add possible activity
  const addActivity = (activityId: string) => {
    if (!orderedActivities.includes(activityId)) {
      setOrderedActivities([...orderedActivities, activityId]);
      savePlan();
    }
    setShowPossible(false);
  };

  // Remove activity
  const removeActivity = (activityId: string) => {
    setOrderedActivities(orderedActivities.filter((id) => id !== activityId));
    savePlan();
  };

  return (
    <main>
      <OfflineIndicator />
      <div className="dashboard safe-bottom">
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

          {/* Departure time */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => {
                setDepartureTime(e.target.value);
                savePlan();
              }}
              className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Activities list */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Activity Order</h2>
              <button
                onClick={() => setShowPossible(!showPossible)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                + Add Activity
              </button>
            </div>

            {/* Possible activities dropdown */}
            {showPossible && (
              <div className="mb-4 bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-2">Add from possible activities:</p>
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

                return (
                  <div
                    key={activityId}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`activity-card draggable ${
                      draggedIndex === index ? 'dragging' : ''
                    } ${isPossible ? 'border-yellow-500/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div className="text-gray-500 cursor-grab active:cursor-grabbing">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                        </svg>
                      </div>

                      {/* Order number */}
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
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
          {selectedDay?.stay && (
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
