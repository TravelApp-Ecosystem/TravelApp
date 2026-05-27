"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar dirección...",
  className = "",
  error = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Verificamos si la API de Google Maps está cargada
    const checkGoogleLoaded = () => {
      if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        initAutocomplete();
      } else {
        // Volvemos a chequear en 500ms
        setTimeout(checkGoogleLoaded, 500);
      }
    };

    const initAutocomplete = () => {
      if (!inputRef.current || autocompleteRef.current) return;

      try {
        // Coordenadas aproximadas de San Miguel de Tucumán para priorizar resultados locales
        const tucumanBounds = {
          north: -26.75,
          south: -26.90,
          east: -65.15,
          west: -65.30,
        };

        // Inicializamos el autocompletado en el input
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["geocode", "establishment"],
          componentRestrictions: { country: "ar" }, // Restringido a Argentina
          bounds: tucumanBounds,
          strictBounds: false, // Bias/priorizar pero permitir buscar fuera si se especifica
          fields: ["formatted_address", "geometry", "name"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const address = place.formatted_address || place.name || "";
            
            // Notificamos al componente padre
            onSelect(address, { lat, lng });
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.error("Error al inicializar Google Places Autocomplete:", err);
      }
    };

    checkGoogleLoaded();

    return () => {
      // Limpieza de event listeners si es necesario
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder={isLoaded ? placeholder : "Cargando mapas predictivos..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold border bg-white focus:outline-none transition-all duration-200 ${
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-slate-200 focus:border-vial-orange focus:ring-2 focus:ring-vial-orange/15"
        } ${className}`}
      />
    </div>
  );
};
