import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Button, TextField } from '@mui/material';
import { MyLocation } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function DraggableMarker({ position, setPosition }) {
  const [currentPosition, setCurrentPosition] = useState(position);

  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  return (
    <Marker
      position={currentPosition}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const newPos = e.target.getLatLng();
          setCurrentPosition([newPos.lat, newPos.lng]);
          setPosition([newPos.lat, newPos.lng]);
        },
      }}
    />
  );
}

export default function LocationMap({ latitude, longitude, onLocationChange }) {
  const defaultLat = latitude || -25.2637; // Asunción, Paraguay
  const defaultLng = longitude || -57.5759;
  
  const [position, setPosition] = useState([defaultLat, defaultLng]);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([parseFloat(latitude), parseFloat(longitude)]);
    }
  }, [latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPosition);
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    onLocationChange(newPosition[0], newPosition[1]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Seleccionar Ubicación
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<MyLocation />}
          onClick={handleUseCurrentLocation}
        >
          Mi Ubicación
        </Button>
      </Box>

      <MapContainer
        center={position}
        zoom={16}
        style={{ height: '300px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} setPosition={handlePositionChange} />
      </MapContainer>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <TextField
          label="Latitud"
          fullWidth
          size="small"
          value={position[0].toFixed(7)}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label="Longitud"
          fullWidth
          size="small"
          value={position[1].toFixed(7)}
          InputProps={{ readOnly: true }}
        />
      </Box>
    </Box>
  );
}

