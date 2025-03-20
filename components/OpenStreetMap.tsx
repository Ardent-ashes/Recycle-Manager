"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import L from "leaflet";

// Fix marker issue in Next.js
import markerIconPng from "leaflet/dist/images/marker-icon.png";

const customIcon = new L.Icon({
  iconUrl: markerIconPng.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function OpenStreetMap() {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([]);

  // Handle click to add markers
  function LocationMarker() {
    useMapEvents({
      click(event) {
        const newMarker = { lat: event.latlng.lat, lng: event.latlng.lng };
        setMarkers((prev) => [...prev, newMarker]);

        // Save to Supabase
        supabase.from("locations").insert([newMarker]).then(({ error }) => {
          if (error) console.error("Error saving location:", error);
        });
      },
    });
    return null;
  }

  return (
    <MapContainer center={[23.8103, 90.4125]} zoom={10} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((marker, index) => (
        <Marker key={index} position={[marker.lat, marker.lng]} icon={customIcon} />
      ))}
      <LocationMarker />
    </MapContainer>
  );
}
