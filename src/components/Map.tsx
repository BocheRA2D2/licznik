
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import type { Point } from '../utils/geo';
import L from 'leaflet';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for User and Ghost
const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8)'></div>",
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});

const ghostIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#ef4444; width:12px; height:12px; border-radius:50%; border:1px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6)'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface MapProps {
  currentPosition: Point | null;
  path: Point[];
  ghostPosition?: Point | null;
  ghostPath?: Point[];
}

const RecenterMap = ({ position }: { position: Point | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], 16);
    }
  }, [position, map]);
  return null;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  }, [map]);
  return null;
};

const Map: React.FC<MapProps> = ({ currentPosition, path, ghostPosition, ghostPath }) => {
  const pathPositions = path.map(p => [p.lat, p.lng] as [number, number]);
  const ghostPositions = ghostPath ? ghostPath.map(p => [p.lat, p.lng] as [number, number]) : [];

  return (
    <div className="map-inner-container" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <MapContainer 
        center={currentPosition ? [currentPosition.lat, currentPosition.lng] : [52.237, 21.017]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', minHeight: '350px' }}
        zoomControl={false}
      >
        <MapResizer />
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {/* User Trail */}
        <Polyline positions={pathPositions} color="#3b82f6" weight={5} opacity={0.8} />
        
        {/* Ghost Trail */}
        {ghostPositions.length > 0 && (
          <Polyline positions={ghostPositions} color="#ef4444" weight={3} opacity={0.5} dashArray="5, 10" />
        )}
        
        {/* Current Position Markers */}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={userIcon} />
        )}
        
        {ghostPosition && (
          <Marker position={[ghostPosition.lat, ghostPosition.lng]} icon={ghostIcon} />
        )}

        <RecenterMap position={currentPosition} />
      </MapContainer>
    </div>
  );
};

export default Map;
