'use client';

import { useState, useEffect } from 'react';
import { Location, getDriveTime } from '@/lib/tripData';
import { getGoogleMapsDirectionsUrl, formatDriveTime, fetchDriveTime } from '@/lib/maps';
import { toggleVisited, setNote } from '@/lib/storage';

interface ActivityCardProps {
  activity: Location;
  previousActivity?: Location;
  isVisited: boolean;
  note?: string;
  onVisitedChange: (visited: boolean) => void;
  onNoteChange: (note: string) => void;
}

export default function ActivityCard({
  activity,
  previousActivity,
  isVisited,
  note,
  onVisitedChange,
  onNoteChange,
}: ActivityCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [localNote, setLocalNote] = useState(note || '');
  const [driveTime, setDriveTime] = useState<number | null>(null);

  // First try hardcoded drive time, then fetch from API if not available
  useEffect(() => {
    if (!previousActivity) {
      setDriveTime(null);
      return;
    }

    // Try hardcoded first
    const hardcoded = getDriveTime(previousActivity.id, activity.id);
    if (hardcoded) {
      setDriveTime(hardcoded);
      return;
    }

    // Fetch from Google Maps API (only if both have coordinates)
    if (previousActivity.lat && previousActivity.lng && activity.lat && activity.lng) {
      fetchDriveTime(
        previousActivity.lat,
        previousActivity.lng,
        activity.lat,
        activity.lng
      ).then((time) => {
        if (time) setDriveTime(time);
      });
    }
  }, [previousActivity, activity]);

  const handleCheckbox = async () => {
    const newValue = await toggleVisited(activity.id);
    onVisitedChange(newValue);
  };

  const handleNoteSave = async () => {
    await setNote(activity.id, localNote);
    onNoteChange(localNote);
    setShowNotes(false);
  };

  return (
    <div className={`activity-card ${isVisited ? 'visited' : ''}`}>
      {driveTime && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 pb-2 border-b border-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{formatDriveTime(driveTime)} drive from {previousActivity?.name}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <button
          onClick={handleCheckbox}
          className={`checkbox ${isVisited ? 'checked' : ''}`}
          aria-label={isVisited ? 'Mark as not visited' : 'Mark as visited'}
        >
          {isVisited && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${isVisited ? 'line-through text-gray-400' : ''}`}>
            {activity.name}
          </h3>

          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href={getGoogleMapsDirectionsUrl(activity.lat, activity.lng, activity.name, activity.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Navigate
            </a>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded border border-gray-600 hover:border-gray-400"
            >
              {note ? 'Edit Note' : 'Add Note'}
            </button>
          </div>

          {showNotes && (
            <div className="mt-3 space-y-2">
              <textarea
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Add your notes here..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm resize-none focus:outline-none focus:border-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNoteSave}
                  className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {note && !showNotes && (
            <p className="mt-2 text-sm text-gray-400 italic">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
