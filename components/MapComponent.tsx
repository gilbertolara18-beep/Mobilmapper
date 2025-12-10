import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint, Coordinates } from '../types';
import { ExternalLink } from 'lucide-react';

// Fix for default Leaflet marker icons in React by using CDN links directly
// Wrapped in safety check to ensure L is defined
if (typeof L !== 'undefined' && L.Marker && L.Marker.prototype && L.Marker.prototype.options) {
  const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

interface MapComponentProps {
  points: GeoPoint[];
  currentLocation: Coordinates | null;
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ points, currentLocation }) => {
  // Default to a central location if no GPS yet (e.g., Mexico City center)
  const center: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude] 
    : [19.4326, -99.1332];

  return (
    <div className="h-full w-full z-0 relative">
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker (Blue Circle) */}
        {currentLocation && (
          <>
            <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={
              L.divIcon({
                className: 'bg-blue-500 rounded-full border-2 border-white shadow-lg',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })
            }>
               <Popup>Tu ubicación actual</Popup>
            </Marker>
            <RecenterMap lat={currentLocation.latitude} lng={currentLocation.longitude} />
          </>
        )}

        {/* Collected Points */}
        {points.map(point => (
          <Marker 
            key={point.id} 
            position={[point.coords.latitude, point.coords.longitude]}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-lg">{point.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{point.type}</p>
                <div className="text-xs bg-gray-100 p-2 rounded mb-2">
                   E: {point.utm.easting} <br/>
                   N: {point.utm.northing} <br/>
                   Zone: {point.utm.zone}{point.utm.band}
                </div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${point.coords.latitude},${point.coords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
                >
                  <ExternalLink size={14} /> Abrir Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;