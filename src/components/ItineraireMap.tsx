'use client';

import { useEffect, useMemo, useState } from 'react';
import { DirectionsRenderer, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '420px',
};

interface ItineraireMapProps {
  pharmacy: {
    latitude: number;
    longitude: number;
    nom: string;
  };
  userPosition: [number, number];
}

export default function ItineraireMap({ pharmacy, userPosition }: ItineraireMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const center = useMemo(() => ({ lat: userPosition[0], lng: userPosition[1] }), [userPosition]);
  const destination = useMemo(() => ({ lat: pharmacy.latitude, lng: pharmacy.longitude }), [pharmacy.latitude, pharmacy.longitude]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['routes'],
  });

  useEffect(() => {
    if (!isLoaded || !apiKey) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: center,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, [apiKey, center, destination, isLoaded]);

  if (!apiKey) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        Ajoutez votre clé Google Maps dans <span className="ml-1 font-medium text-slate-800">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> pour afficher la carte.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        La carte Google Maps n’a pas pu être chargée. Vérifiez votre clé API et les autorisations Google Cloud.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Chargement de la carte...
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <Marker position={center} title="Votre position" />
      <Marker position={destination} title={pharmacy.nom} />
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}
