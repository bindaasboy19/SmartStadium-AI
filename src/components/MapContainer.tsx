import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Zone, Stall, Staff } from '../hooks/useStadiumData';

interface MapProps {
  apiKey: string;
  center: { lat: number; lng: number };
  zoom: number;
  onMapLoad?: (map: google.maps.Map) => void;
  zones?: Zone[];
  stalls?: Stall[];
  staff?: Staff[];
  children?: React.ReactNode;
  emergencyMode?: boolean;
}

export const MapContainer: React.FC<MapProps> = ({ apiKey, center, zoom, onMapLoad, zones = [], stalls = [], staff = [], children, emergencyMode }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const zonesRef = useRef<google.maps.Circle[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      if (!apiKey) {
        console.warn("Google Maps API Key is missing. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.");
      }
      setOptions({
        key: apiKey,
        v: "weekly"
      });

      try {
        const { Map } = await importLibrary("maps") as google.maps.MapsLibrary;
        // Also import visualization and geometry if needed, though they are often available once loaded
        await importLibrary("visualization");
        await importLibrary("geometry");

        if (mapRef.current) {
          const newMap = new Map(mapRef.current, {
            center,
            zoom,
            disableDefaultUI: true,
            styles: [
              { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#888888" }, { "visibility": "off" }] },
              { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#111111" }] },
              { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#111111" }] },
              { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#111111" }] },
              { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
            ]
          });
          setMap(newMap);
          if (onMapLoad) onMapLoad(newMap);
        }
      } catch (err) {
        console.error("Failed to load Google Maps:", err);
      }
    };

    initMap();
  }, [apiKey]);

  useEffect(() => {
    if (!map || !zones.length) return;

    // Clear old circles
    zonesRef.current.forEach(c => c.setMap(null));
    zonesRef.current = [];

    // Draw Zone Heatmap Circles
    zones.forEach(zone => {
      // Offset positions for visualization relative to stadium center
      const offsets: Record<string, { lat: number, lng: number }> = {
        north: { lat: 0.001, lng: 0 },
        south: { lat: -0.001, lng: 0 },
        east: { lat: 0, lng: 0.001 },
        west: { lat: 0, lng: -0.001 },
        pitch: { lat: 0, lng: 0 }
      };
      
      const pos = offsets[zone.id] || { lat: 0, lng: 0 };
      const circle = new google.maps.Circle({
        strokeColor: zone.color || "#FFFFFF",
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: zone.color || "#FFFFFF",
        fillOpacity: Math.min(0.8, zone.density * 0.8),
        map: map,
        center: { lat: center.lat + pos.lat, lng: center.lng + pos.lng },
        radius: 100 * (0.8 + zone.density * 0.4)
      });
      zonesRef.current.push(circle);
    });
  }, [map, zones]);

  useEffect(() => {
    if (!map || !stalls.length) return;
    
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    stalls.forEach(stall => {
      const isExit = stall.type === 'gate' || stall.type === 'exit';
      const marker = new google.maps.Marker({
        position: stall.location,
        map: map,
        title: stall.name,
        label: {
            text: stall.queueSize.toString(),
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
        },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: isExit ? (emergencyMode ? '#ef4444' : '#10b981') : (stall.type === 'food' ? '#f59e0b' : '#3b82f6'),
            fillOpacity: 1,
            strokeColor: emergencyMode && isExit ? 'white' : 'transparent',
            strokeWeight: emergencyMode && isExit ? 2 : 0,
            scale: emergencyMode && isExit ? 18 : 12
        }
      });
      markersRef.current.push(marker);
    });
  }, [map, stalls, emergencyMode]);

  const staffMarkersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map || !staff.length) return;
    
    staffMarkersRef.current.forEach(m => m.setMap(null));
    staffMarkersRef.current = [];

    staff.forEach(s => {
      const marker = new google.maps.Marker({
        position: s.location,
        map: map,
        title: `${s.name} (${s.role})`,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#6366f1',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 1,
            scale: 6,
            rotation: 0
        }
      });
      staffMarkersRef.current.push(marker);
    });
  }, [map, staff]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" id="stadium-map" />
      {map && children}
    </div>
  );
};
