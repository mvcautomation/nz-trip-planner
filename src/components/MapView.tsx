'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Location, Accommodation } from '@/lib/tripData';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: 'red' | 'green' | 'blue' | 'purple' | 'orange';
}

interface MapViewProps {
  markers: MapMarker[];
  title?: string;
  className?: string;
  height?: string;
}

// LOTR Middle-earth themed color mapping for markers
const colorMap: Record<string, string> = {
  green: '#3d6b3d',   // Deep Shire green - the rolling hills of Hobbiton
  blue: '#4a6741',    // Fangorn forest moss
  purple: '#6b4423',  // Rivendell wood brown - elven halls
  orange: '#c9a227',  // One Ring gold - precious
  red: '#8b4513',     // Mordor rust - Mount Doom earth
};

export default function MapView({ markers, title, className = '', height = '300px' }: MapViewProps) {
  const [showList, setShowList] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Memoize markers to prevent unnecessary re-renders
  const markersKey = useMemo(() =>
    markers.map(m => `${m.lat},${m.lng},${m.label}`).join('|'),
    [markers]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || markers.length === 0 || showList) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        // Load Mapbox CSS if not already loaded
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
          document.head.appendChild(link);
          await new Promise<void>((resolve) => {
            link.onload = () => resolve();
            setTimeout(resolve, 300);
          });
        }

        if (!isMounted || !mapContainerRef.current) return;

        // Clean up existing map and markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Set access token
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

        if (!mapboxgl.accessToken) {
          setMapError('Mapbox token not configured');
          return;
        }

        // Calculate bounds
        const lats = markers.map(m => m.lat);
        const lngs = markers.map(m => m.lng);
        const bounds = new mapboxgl.LngLatBounds(
          [Math.min(...lngs) - 0.05, Math.min(...lats) - 0.05],
          [Math.max(...lngs) + 0.05, Math.max(...lats) + 0.05]
        );

        // Create map with vintage/outdoors style
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          bounds: bounds,
          fitBoundsOptions: { padding: 40 },
          attributionControl: true,
          scrollZoom: true,
          dragPan: true,
          touchZoomRotate: true,
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          if (!isMounted) return;

          // Apply vintage/sepia filter to the map
          map.setPaintProperty('land', 'background-color', '#e0c9a6');

          // Add markers
          markers.forEach((marker, index) => {
            const color = colorMap[marker.color || 'red'];
            const letter = String.fromCharCode(65 + (index % 26));

            // Create marker element with elvish/medieval styling
            const el = document.createElement('div');
            el.className = 'mapbox-custom-marker';
            el.innerHTML = `
              <div style="
                width: 30px;
                height: 30px;
                background: radial-gradient(circle at 30% 30%, ${color} 0%, ${color}dd 70%, ${color}99 100%);
                border: 2px solid #c9a227;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #f5e6c8;
                font-weight: bold;
                font-size: 12px;
                font-family: 'Times New Roman', serif;
                box-shadow: 0 3px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.2);
                cursor: pointer;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
              ">${letter}</div>
            `;

            // Use place name search for better Google Maps results (with reviews, etc.)
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.label)}`;

            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="min-width: 150px; padding: 4px; font-family: 'Times New Roman', Georgia, serif;">
                  <strong style="color: #f5e6c8; display: block; margin-bottom: 6px; font-size: 14px;">${marker.label}</strong>
                  <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer"
                     style="color: #c9a227; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                    <span>Open in Google Maps</span>
                    <span style="font-size: 14px;">→</span>
                  </a>
                </div>
              `);

            const m = new mapboxgl.Marker(el)
              .setLngLat([marker.lng, marker.lat])
              .setPopup(popup)
              .addTo(map);

            markersRef.current.push(m);
          });

          setMapLoaded(true);
        });

        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Failed to load map');
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('Failed to initialize map');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markersKey, showList]);

  if (markers.length === 0) {
    return (
      <div className={`bg-slate-800/50 rounded-xl p-4 ${className}`}>
        <p className="text-slate-400 text-center">No locations to display</p>
      </div>
    );
  }

  // Build directions URL if multiple markers (Google Maps for directions)
  // Use place names for better search results
  let mapsUrl = '';
  if (markers.length === 1) {
    mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(markers[0].label)}`;
  } else {
    const origin = encodeURIComponent(markers[0].label);
    const destination = encodeURIComponent(markers[markers.length - 1].label);
    const waypoints = markers.slice(1, -1).map(m => encodeURIComponent(m.label)).join('|');
    mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowList(!showList)}
              className="text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
            >
              {showList ? 'Map' : 'List'}
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-full transition-colors hover:brightness-110"
              style={{ backgroundColor: 'rgba(201, 162, 39, 0.2)', color: '#c9a227', border: '1px solid rgba(201, 162, 39, 0.3)' }}
            >
              Open in Maps
            </a>
          </div>
        </div>
      )}

      {showList ? (
        <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
          {markers.map((marker, index) => (
            <a
              key={index}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.label)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <span
                className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: colorMap[marker.color || 'red'] }}
              >
                {String.fromCharCode(65 + (index % 26))}
              </span>
              <span className="text-sm text-white flex-1">{marker.label}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      ) : (
        <div style={{ height, position: 'relative' }}>
          <style>{`
            /* LOTR parchment map style - aged Middle-earth aesthetic */
            .mapboxgl-canvas {
              filter: sepia(0.45) saturate(0.75) brightness(0.92) hue-rotate(-8deg) contrast(1.05) !important;
            }
            .mapboxgl-ctrl-attrib {
              background: rgba(45, 33, 24, 0.8) !important;
              color: #8b6b4d !important;
              font-size: 10px !important;
            }
            .mapboxgl-ctrl-attrib a {
              color: #d4a853 !important;
            }
            .mapboxgl-ctrl-group {
              background: #2d2118 !important;
              border-color: #4a3728 !important;
            }
            .mapboxgl-ctrl-group button {
              background-color: #2d2118 !important;
              border-color: #4a3728 !important;
            }
            .mapboxgl-ctrl-group button:hover {
              background-color: #4a3728 !important;
            }
            .mapboxgl-ctrl-group button span {
              filter: invert(1) !important;
            }
            .mapboxgl-popup-content {
              background: linear-gradient(135deg, #2d2118 0%, #3a2a1d 100%) !important;
              color: #f5e6c8 !important;
              border-radius: 8px !important;
              padding: 12px !important;
              border: 1px solid #4a3728 !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
            }
            .mapboxgl-popup-tip {
              border-top-color: #2d2118 !important;
            }
            .mapboxgl-popup-close-button {
              color: #c9a227 !important;
              font-size: 18px !important;
            }
            .mapboxgl-popup-close-button:hover {
              background: rgba(201, 162, 39, 0.2) !important;
            }
            /* Keep markers crisp (not affected by sepia) */
            .mapbox-custom-marker {
              filter: none !important;
            }
          `}</style>
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }}
          />
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#2d2118' }}>
              <div className="animate-spin w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full" />
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#2d2118' }}>
              <p className="text-amber-400 text-sm">{mapError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to convert locations to markers (filters out locations without coordinates)
export function locationsToMarkers(
  locations: (Location | { id: string; name: string; lat?: number; lng?: number; category?: string })[],
  color: 'red' | 'green' | 'blue' | 'purple' | 'orange' = 'green'
): MapMarker[] {
  return locations
    .filter(loc => loc.lat !== undefined && loc.lng !== undefined)
    .map(loc => ({
      lat: loc.lat!,
      lng: loc.lng!,
      label: loc.name,
      color,
    }));
}

// Helper function to convert accommodation to marker
export function accommodationToMarker(
  accommodation: Accommodation,
  color: 'red' | 'green' | 'blue' | 'purple' | 'orange' = 'purple'
): MapMarker {
  return {
    lat: accommodation.lat,
    lng: accommodation.lng,
    label: `${accommodation.hotelName} (${accommodation.city})`,
    color,
  };
}
