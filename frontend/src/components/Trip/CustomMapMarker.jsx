import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const getCustomIcon = (status) => {
  const isApproved = status === 'approved';
  const fillColor = isApproved ? '#93E74F' : '#FDE047'; 
  const html = `
    <div style="filter: drop-shadow(2px 2px 0px rgba(0,0,0,1)); transition: transform 0.2s; cursor: pointer;" 
         onmouseover="this.style.transform='scale(1.1)'" 
         onmouseout="this.style.transform='scale(1)'">
      <svg width="26" height="38" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 2C6.48 2 2 6.48 2 12c0 6 10 22 10 22s10-16 10-22c0-5.52-4.48-10-10-10z" 
          fill="${fillColor}" 
          stroke="black" 
          stroke-width="2" 
          stroke-linejoin="round"
        />
        <circle cx="12" cy="12" r="4" fill="white" stroke="black" stroke-width="1.5" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-pin', 
    iconSize: [26, 38],      
    iconAnchor: [13, 38],    
    popupAnchor: [0, -35]    
  });
};

const CustomMapMarker = ({ loc, opacity }) => {
  return (
    <Marker 
      position={[loc.lat, loc.lng]} 
      opacity={opacity}
      icon={getCustomIcon(loc.status)}
    >
      <Popup className="font-bold text-black uppercase italic">
        <span className="block font-black text-sm">{loc.name}</span>
        <span className="block text-[10px] text-gray-500 mt-1">
          {loc.status === 'approved' ? '✅ ДОДАНО В МАРШРУТ' : '⌛ ЙДЕ ГОЛОСУВАННЯ'}
        </span>
      </Popup>
    </Marker>
  );
};

export default CustomMapMarker;