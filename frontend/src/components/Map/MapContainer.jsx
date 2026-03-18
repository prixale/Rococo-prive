import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';

const MapContainer = ({ 
  center = { lat: -33.4489, lng: -70.6693 }, 
  zoom = 13,
  showInfo = false,
  markerTitle = 'Mi ubicación'
}) => {
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isProduction = import.meta.env.MODE === 'production';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
    version: 'quarterly'
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  const handleRetry = useCallback(() => {
    setError(null);
    setRetrying(true);
    setTimeout(() => setRetrying(false), 1000);
  }, []);

  if (!apiKey) {
    return (
      <div className="map-error-container">
        <AlertCircle size={24} />
        <p>API Key de Google Maps no configurada</p>
        <span>Contacta al administrador del sistema</span>
      </div>
    );
  }

  if (loadError || error) {
    return (
      <div className="map-error-container">
        <AlertCircle size={24} />
        <p>Error al cargar el mapa</p>
        <span>{loadError?.message || error}</span>
        <button onClick={handleRetry} className="map-retry-btn">
          <RefreshCw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading-container">
        <div className="map-loading-spinner"></div>
        <p>Cargando mapa...</p>
        <span>{isProduction ? 'Conectando a Google Maps' : 'Modo: Desarrollo'}</span>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
      >
        <MarkerF 
          position={center}
          title={markerTitle}
          animation={window.google?.maps?.Animation?.DROP}
        >
          {showInfo && (
            <InfoWindowF position={center}>
              <div style={{ padding: '8px', maxWidth: '200px' }}>
                <strong style={{ fontSize: '14px' }}>{markerTitle}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                  Lat: {center.lat.toFixed(6)}, Lng: {center.lng.toFixed(6)}
                </p>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      </GoogleMap>
      
      <div className="map-footer-info">
        <MapPin size={14} />
        <span>📍 {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default MapContainer;
