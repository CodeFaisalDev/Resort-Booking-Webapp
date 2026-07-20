'use client';
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Resort {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  rating: number;
}

interface ResortMapProps {
  resorts: Resort[];
  selectedResortId: string | null;
  onMarkerClick: (id: string) => void;
}

export default function ResortMap({ resorts, selectedResortId, onMarkerClick }: ResortMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([20.0, 0.0], 2);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Add colorful Voyager tiles (which we invert/color-shift in CSS to create a colored dark-mode map)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Custom glowing icon
    const defaultIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background-color: #fbbf24; border: 2px solid #0c0a09; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 8px #fbbf24;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const activeIcon = L.divIcon({
      className: 'custom-map-pin-active',
      html: `<div style="background-color: #f59e0b; border: 2.5px solid #ffffff; width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 0 15px #f59e0b; animation: pulse 1.5s infinite;"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    // Add markers for all resorts
    resorts.forEach(r => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      
      const isSelected = r.id === selectedResortId;
      const marker = L.marker([lat, lng], {
        icon: isSelected ? activeIcon : defaultIcon
      }).addTo(map);

      marker.on('click', () => {
        onMarkerClick(r.id);
      });

      marker.bindTooltip(`<b>${r.name}</b><br/>⭐ ${r.rating}`, {
        direction: 'top',
        className: 'custom-map-tooltip'
      });

      markersRef.current[r.id] = marker;
    });

    return () => {
      // Map stays initialized
    };
  }, [resorts]);

  // Handle flyTo when selectedResortId changes
  useEffect(() => {
    if (!mapRef.current || !selectedResortId) return;
    const map = mapRef.current;
    
    // Recalculate dimensions in case the container was hidden or resized
    map.invalidateSize();
    
    const selectedResort = resorts.find(r => r.id === selectedResortId);
    const lat = selectedResort ? Number(selectedResort.latitude) : NaN;
    const lng = selectedResort ? Number(selectedResort.longitude) : NaN;
    if (!isNaN(lat) && !isNaN(lng)) {
      const container = map.getContainer();
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        map.flyTo([lat, lng], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      } else {
        map.setView([lat, lng], 12);
      }
      
      // Update markers icons
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        const isSelected = id === selectedResortId;
        const defaultIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: #fbbf24; border: 2px solid #0c0a09; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 8px #fbbf24;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const activeIcon = L.divIcon({
          className: 'custom-map-pin-active',
          html: `<div style="background-color: #f59e0b; border: 2.5px solid #ffffff; width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 0 15px #f59e0b;"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
        marker.setIcon(isSelected ? activeIcon : defaultIcon);
      });
    }
  }, [selectedResortId, resorts]);

  // Clean up fully on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-stone-850">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '450px' }} />
      <style jsx global>{`
        .custom-map-tooltip {
          background-color: #1c1917 !important;
          color: #f5f5f4 !important;
          border: 1px solid #78350f !important;
          border-radius: 8px !important;
          font-family: var(--font-sans), sans-serif !important;
          font-size: 11px !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-container {
          background: #0c0a09 !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(120, 53, 4, 0.2) !important;
        }
        .leaflet-bar a {
          background-color: #1c1917 !important;
          color: #fbbf24 !important;
          border-bottom: 1px solid rgba(120, 53, 4, 0.2) !important;
        }
        .leaflet-bar a:hover {
          background-color: #292524 !important;
          color: #fbbf24 !important;
        }
      `}</style>
    </div>
  );
}
