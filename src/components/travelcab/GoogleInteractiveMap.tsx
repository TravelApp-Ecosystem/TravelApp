"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Trip, TripStatus } from "@/types/travelcab";
import { Car, Compass, Play, CheckCircle, Navigation } from "lucide-react";

interface GoogleInteractiveMapProps {
  activeTrip: Trip | null;
  trips: Trip[];
  onUpdateTripStatus?: (tripId: string, newStatus: TripStatus, driverName?: string) => void;
  previewCoords?: {
    originCoords: { lat: number; lng: number } | null;
    destinationCoords: { lat: number; lng: number } | null;
  } | null;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// San Miguel de Tucumán por defecto
const defaultCenter = {
  lat: -26.82414,
  lng: -65.22260,
};

// Diseño Oscuro Premium (JSON)
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] }, // slate-900
  { elementType: "labels.text.stroke", stylers: [{ color: "#020617" }] }, // slate-950
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] }, // slate-500
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }], // slate-300
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }], // slate-800
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }], // slate-800
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }], // slate-700
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e2e8f0" }], // slate-200
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1e3a8a" }], // deep blue
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
];

const mapOptions = {
  styles: darkMapStyle,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

const GOOGLE_MAPS_LIBRARIES: any[] = ["places"];

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = ({
  activeTrip,
  trips,
  onUpdateTripStatus,
  previewCoords,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  // Conductores simulados en la flota en San Miguel de Tucumán
  const [drivers, setDrivers] = useState([
    { id: "drv-1", name: "Ana Martínez (Mov. 07)", lat: -26.815, lng: -65.210, status: "Disponible", color: "#3b82f6" },
    { id: "drv-2", name: "Roberto Gómez (Mov. 14)", lat: -26.835, lng: -65.230, status: "Disponible", color: "#eab308" },
    { id: "drv-3", name: "Luis Fernández (Mov. 22)", lat: -26.820, lng: -65.240, status: "Disponible", color: "#10b981" },
    { id: "drv-4", name: "Carlos Pérez (Mov. 10)", lat: -26.800, lng: -65.200, status: "Disponible", color: "#a855f7" },
  ]);

  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [carPosition, setCarPosition] = useState<{ lat: number; lng: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Cargar ruta cuando cambia el viaje activo o las coordenadas de vista previa
  useEffect(() => {
    if (!isLoaded) {
      setDirections(null);
      setCarPosition(null);
      setAssignedDriverId(null);
      return;
    }

    let origin: { lat: number; lng: number } | null = null;
    let destination: { lat: number; lng: number } | null = null;

    if (activeTrip?.originCoords && activeTrip?.destinationCoords) {
      origin = activeTrip.originCoords;
      destination = activeTrip.destinationCoords;
    } else if (previewCoords?.originCoords && previewCoords?.destinationCoords) {
      origin = previewCoords.originCoords;
      destination = previewCoords.destinationCoords;
    }

    if (origin && destination) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            
            // Centrar el mapa en la ruta
            if (map && result.routes[0]?.bounds) {
              map.fitBounds(result.routes[0].bounds);
            }
          } else {
            console.error("Error al calcular ruta de Google Maps:", status);
          }
        }
      );
    } else {
      setDirections(null);
      setCarPosition(null);
      setAssignedDriverId(null);
    }
  }, [
    activeTrip?.id,
    activeTrip?.originCoords?.lat,
    activeTrip?.originCoords?.lng,
    activeTrip?.destinationCoords?.lat,
    activeTrip?.destinationCoords?.lng,
    previewCoords?.originCoords?.lat,
    previewCoords?.originCoords?.lng,
    previewCoords?.destinationCoords?.lat,
    previewCoords?.destinationCoords?.lng,
    isLoaded,
    map
  ]);

  // Manejar simulación de movimiento del auto
  useEffect(() => {
    // Cancelar animación previa
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    if (!activeTrip || !directions || !activeTrip.status) return;

    const routePath = directions.routes[0]?.overview_path;
    if (!routePath || routePath.length === 0) return;

    // Asignar chofer si está en camino o viaje y no hay uno asignado
    if ((activeTrip.status === "En Camino" || activeTrip.status === "En Viaje") && !assignedDriverId) {
      // Elegimos un conductor disponible al azar
      const available = drivers.find(d => d.status === "Disponible") || drivers[0];
      setAssignedDriverId(available.id);
      
      // Actualizamos su estado en la lista local
      setDrivers(prev => prev.map(d => d.id === available.id ? { ...d, status: "Ocupado" } : d));
      
      if (onUpdateTripStatus && !activeTrip.driverName) {
        onUpdateTripStatus(activeTrip.id, activeTrip.status, available.name);
      }
    }

    let pathPoints: google.maps.LatLng[] = [];

    if (activeTrip.status === "En Camino" && activeTrip.originCoords) {
      // El auto viaja desde la ubicación del conductor hasta el origen del pasajero (simulado directo por ahora)
      const driver = drivers.find(d => d.id === assignedDriverId) || drivers[0];
      const start = new window.google.maps.LatLng(driver.lat, driver.lng);
      const end = new window.google.maps.LatLng(activeTrip.originCoords.lat, activeTrip.originCoords.lng);
      
      // Creamos 40 puntos intermedios simples de interpolación
      for (let i = 0; i <= 40; i++) {
        const fraction = i / 40;
        const lat = driver.lat + (activeTrip.originCoords.lat - driver.lat) * fraction;
        const lng = driver.lng + (activeTrip.originCoords.lng - driver.lng) * fraction;
        pathPoints.push(new window.google.maps.LatLng(lat, lng));
      }
    } else if (activeTrip.status === "En Viaje") {
      // El auto viaja a lo largo de la ruta de Google Maps
      pathPoints = routePath;
    }

    if (pathPoints.length > 0) {
      let index = 0;
      setCarPosition({ lat: pathPoints[0].lat(), lng: pathPoints[0].lng() });

      const interval = setInterval(() => {
        index++;
        if (index < pathPoints.length) {
          const point = pathPoints[index];
          const newPos = { lat: point.lat(), lng: point.lng() };
          setCarPosition(newPos);
          
          // Mover el mapa suavemente con el auto
          if (map) {
            map.panTo(newPos);
          }
        } else {
          // Llegó a destino del tramo
          clearInterval(interval);
          animationRef.current = null;

          // Si llegó al origen del pasajero en "En Camino", podemos pasarlo automáticamente a "En Viaje" tras unos segundos
          if (activeTrip.status === "En Camino" && onUpdateTripStatus) {
            setTimeout(() => {
              onUpdateTripStatus(activeTrip.id, "En Viaje", activeTrip.driverName);
            }, 3000);
          } else if (activeTrip.status === "En Viaje" && onUpdateTripStatus) {
            // Completó el viaje
            setTimeout(() => {
              onUpdateTripStatus(activeTrip.id, "Completado", activeTrip.driverName);
              // Liberar conductor
              if (assignedDriverId) {
                setDrivers(prev => prev.map(d => d.id === assignedDriverId ? { ...d, status: "Disponible", lat: pathPoints[pathPoints.length-1].lat(), lng: pathPoints[pathPoints.length-1].lng() } : d));
              }
              setAssignedDriverId(null);
              setCarPosition(null);
            }, 3000);
          }
        }
      }, 150); // Velocidad de la animación

      animationRef.current = interval as any;
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [activeTrip?.status, directions, assignedDriverId]);

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 p-6 text-center text-red-400">
        <div>
          <p className="text-lg font-bold">Error al cargar Google Maps</p>
          <p className="mt-2 text-sm text-slate-500">Por favor, verifica que NEXT_PUBLIC_GOOGLE_MAPS_API_KEY sea una clave válida.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Compass className="h-12 w-12 animate-spin text-vial-orange mb-4" />
        <p className="text-sm font-semibold tracking-wide">Cargando Google Maps Satelital...</p>
      </div>
    );
  }

  const handleUpdateStatus = (status: TripStatus) => {
    if (activeTrip && onUpdateTripStatus) {
      onUpdateTripStatus(activeTrip.id, status, activeTrip.driverName);
    }
  };

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={activeTrip?.originCoords || previewCoords?.originCoords || defaultCenter}
        zoom={13}
        options={mapOptions}
        onLoad={(m) => setMap(m)}
        onUnmount={() => setMap(null)}
      >
        {/* Renderizador de Rutas de Google */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // Manejamos nuestros marcadores personalizados
              polylineOptions: {
                strokeColor: "#ff7b1a", // Color naranja vial de TravelCab
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {/* Marcadores de Viaje Activo o Vista Previa */}
        {activeTrip && activeTrip.originCoords && (
          <Marker
            position={activeTrip.originCoords}
            label={{
              text: "A",
              color: "white",
              fontWeight: "bold",
            }}
            title={`Origen: ${activeTrip.origin}`}
          />
        )}
        {!activeTrip && previewCoords?.originCoords && (
          <Marker
            position={previewCoords.originCoords}
            label={{
              text: "A",
              color: "white",
              fontWeight: "bold",
            }}
            title="Origen cotizado"
          />
        )}

        {activeTrip && activeTrip.destinationCoords && (
          <Marker
            position={activeTrip.destinationCoords}
            label={{
              text: "B",
              color: "black",
              fontWeight: "bold",
            }}
            title={`Destino: ${activeTrip.destination}`}
          />
        )}
        {!activeTrip && previewCoords?.destinationCoords && (
          <Marker
            position={previewCoords.destinationCoords}
            label={{
              text: "B",
              color: "black",
              fontWeight: "bold",
            }}
            title="Destino cotizado"
          />
        )}

        {/* Icono del Auto Animado (si hay posición de animación activa) */}
        {carPosition && (
          <Marker
            position={carPosition}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#ff7b1a",
              fillOpacity: 1.0,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              rotation: 90, // Rotar ícono de auto
            }}
            title={activeTrip?.driverName || "Vehículo TravelCab"}
          />
        )}

        {/* Marcadores de Flota (conductores que no están en el viaje activo) */}
        {drivers.map((drv) => {
          // Si es el conductor asignado al viaje animado, no lo duplicamos
          if (drv.id === assignedDriverId && carPosition) return null;

          return (
            <Marker
              key={drv.id}
              position={{ lat: drv.lat, lng: drv.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: drv.color,
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWeight: 1.5,
              }}
              title={`${drv.name} - ${drv.status}`}
            />
          );
        })}
      </GoogleMap>

      {/* Flotante superior con info del viaje seleccionado */}
      {activeTrip && (
        <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:w-96 rounded-2xl border border-slate-700/50 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md text-white animate-fadeIn z-10">
          <div className="flex items-start justify-between border-b border-slate-700/60 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-vial-orange">Viaje Seleccionado</span>
              <h3 className="text-sm font-bold mt-0.5">{activeTrip.passengerName}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">ID: {activeTrip.id}</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-vial-orange">
              {activeTrip.status}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Desde:</span>
              <span className="font-semibold text-slate-200 line-clamp-1 max-w-[200px]">{activeTrip.origin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hacia:</span>
              <span className="font-semibold text-slate-200 line-clamp-1 max-w-[200px]">{activeTrip.destination}</span>
            </div>
            {activeTrip.driverName && (
              <div className="flex justify-between items-center bg-slate-850 p-2 rounded-lg mt-2 border border-slate-800">
                <span className="text-slate-400 flex items-center">
                  <Car className="h-3.5 w-3.5 text-vial-orange mr-1.5" />
                  Móvil asignado:
                </span>
                <span className="font-bold text-slate-100">{activeTrip.driverName}</span>
              </div>
            )}
          </div>

          {/* Acciones de Control de Flujo (para probar simulación) */}
          <div className="mt-4 flex gap-2">
            {activeTrip.status === "Buscando Chofer" && (
              <button
                onClick={() => handleUpdateStatus("En Camino")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-vial-orange py-2 text-center text-xs font-bold text-gray-950 hover:opacity-90 transition-all cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 fill-gray-950" />
                Despachar Chofer
              </button>
            )}
            
            {activeTrip.status === "En Camino" && (
              <button
                onClick={() => handleUpdateStatus("En Viaje")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white hover:bg-blue-500 transition-all cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Iniciar Viaje
              </button>
            )}

            {activeTrip.status === "En Viaje" && (
              <button
                onClick={() => handleUpdateStatus("Completado")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-center text-xs font-bold text-white hover:bg-green-500 transition-all cursor-pointer"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Finalizar Viaje
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
