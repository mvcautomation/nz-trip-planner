'use client';

import { useState } from 'react';
import { Accommodation } from '@/lib/tripData';

interface AccommodationCardProps {
  accommodation: Accommodation;
  legacyStayName?: string;
}

export default function AccommodationCard({
  accommodation,
}: AccommodationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(accommodation.address)}`;
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodation.hotelName + ' ' + accommodation.city)}`;

  return (
    <div className="accommodation-card">
      {/* Header - always visible */}
      <div
        className="accommodation-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="accommodation-icon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-400/80 uppercase tracking-wide font-medium">Overnight Stay</p>
            <p className="font-semibold text-amber-50 truncate">{accommodation.hotelName}</p>
            <p className="text-sm text-gray-400">{accommodation.city}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="expand-btn"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className={`accommodation-details ${isExpanded ? 'expanded' : ''}`}>
        <div className="accommodation-details-inner">
          {/* Address */}
          <div className="detail-row">
            <div className="detail-icon">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="detail-content">
              <p className="detail-label">Address</p>
              <p className="detail-value">{accommodation.address}</p>
            </div>
          </div>

          {/* Phone */}
          {accommodation.phone && (
            <div className="detail-row">
              <div className="detail-icon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="detail-content">
                <p className="detail-label">Phone</p>
                <a href={`tel:${accommodation.phone}`} className="detail-value detail-link">
                  {accommodation.phone}
                </a>
              </div>
            </div>
          )}

          {/* Booking Reference */}
          {accommodation.bookingRef && (
            <div className="detail-row">
              <div className="detail-icon">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="detail-content">
                <p className="detail-label">
                  Booking {accommodation.bookingSource && `(${accommodation.bookingSource})`}
                </p>
                <p className="detail-value font-mono text-sm">{accommodation.bookingRef}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="accommodation-actions">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="accommodation-btn accommodation-btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Navigate
            </a>
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="accommodation-btn accommodation-btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              View on Maps
            </a>
            {accommodation.phone && (
              <a
                href={`tel:${accommodation.phone}`}
                className="accommodation-btn accommodation-btn-secondary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
