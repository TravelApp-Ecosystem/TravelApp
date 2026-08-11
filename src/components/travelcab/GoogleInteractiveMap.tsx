"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from "@react-google-maps/api";
import { Trip, TripStatus } from "@/types/travelcab";
import { Car, Compass, Play, CheckCircle, Navigation, User, Phone } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

// Diseño Claro Premium Moderno (JSON)
const lightMapStyle = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }, { lightness: 17 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 18 }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 16 }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dedede" }, { lightness: 21 }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }, { lightness: 19 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#fefefe" }, { lightness: 20 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
  },
];

const mapOptions = {
  styles: lightMapStyle,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

const GOOGLE_MAPS_LIBRARIES: any[] = ["places"];

export interface RealDriver {
  id: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  status: string;
  isOnline: boolean;
  vehicle: string;
  plate: string;
  color: string;
}

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
  
  // Conductores reales desde la colección Firestore `drivers`
  const [realDrivers, setRealDrivers] = useState<RealDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<RealDriver | null>(null);

  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [carPosition, setCarPosition] = useState<{ lat: number; lng: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Escuchar en tiempo real la colección de choferes en Firestore `drivers`
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drivers'), (snapshot) => {
      const list: RealDriver[] = snapshot.docs.map((docSnap, index) => {
        const data = docSnap.data();
        const fullName = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Socio Conductor';
        
        // Coordenadas reales GPS (o dispersión sutil si recién inicia)
        const lat = data.location?.latitude || data.location?.lat || data.currentLocation?.latitude || (-26.82414 + (index * 0.003));
        const lng = data.location?.longitude || data.location?.lng || data.currentLocation?.longitude || (-65.22260 + (index * 0.004));

        return {
          id: docSnap.id,
          name: fullName,
          phone: data.phone || '+54 381 000-0000',
          lat,
          lng,
          status: data.status || 'Activo',
          isOnline: data.isOnline !== false,
          vehicle: data.activeVehicle?.brand || data.activeVehicle?.make || 'Vehículo Habilitado',
          plate: data.activeVehicle?.plate || 'AB 123 CD',
          color: data.activeVehicle?.color || 'Gris',
        };
      });

      setRealDrivers(list);
    }, (err) => {
      console.error('Error listening to drivers for Dispatcher map:', err);
    });

    return () => unsub();
  }, []);

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

  // Manejar movimiento del viaje activo
  useEffect(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    if (!activeTrip || !directions || !activeTrip.status) return;

    const routePath = directions.routes[0]?.overview_path;
    if (!routePath || routePath.length === 0) return;

    if ((activeTrip.status === "En Camino" || activeTrip.status === "En Viaje") && !assignedDriverId) {
      const available = realDrivers.find(d => d.status === "Activo") || realDrivers[0];
      if (available) {
        setAssignedDriverId(available.id);
        if (onUpdateTripStatus && !activeTrip.driverName) {
          onUpdateTripStatus(activeTrip.id, activeTrip.status, available.name);
        }
      }
    }

    let pathPoints: google.maps.LatLng[] = [];

    if (activeTrip.status === "En Camino" && activeTrip.originCoords) {
      const driver = realDrivers.find(d => d.id === assignedDriverId) || realDrivers[0];
      const dLat = driver?.lat || -26.82414;
      const dLng = driver?.lng || -65.22260;

      for (let i = 0; i <= 40; i++) {
        const fraction = i / 40;
        const lat = dLat + (activeTrip.originCoords.lat - dLat) * fraction;
        const lng = dLng + (activeTrip.originCoords.lng - dLng) * fraction;
        pathPoints.push(new window.google.maps.LatLng(lat, lng));
      }
    } else if (activeTrip.status === "En Viaje") {
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
          if (map) {
            map.panTo(newPos);
          }
        } else {
          clearInterval(interval);
          animationRef.current = null;

          if (activeTrip.status === "En Camino" && onUpdateTripStatus) {
            setTimeout(() => {
              onUpdateTripStatus(activeTrip.id, "En Viaje", activeTrip.driverName);
            }, 3000);
          } else if (activeTrip.status === "En Viaje" && onUpdateTripStatus) {
            setTimeout(() => {
              onUpdateTripStatus(activeTrip.id, "Completado", activeTrip.driverName);
              setAssignedDriverId(null);
              setCarPosition(null);
            }, 3000);
          }
        }
      }, 150);

      animationRef.current = interval as any;
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [activeTrip?.status, directions, assignedDriverId, realDrivers]);

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
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#ff7b1a",
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            }}
          />
        )}

        {/* Origen (A) */}
        {activeTrip && activeTrip.originCoords && (
          <Marker
            position={activeTrip.originCoords}
            label={{ text: "A", color: "white", fontWeight: "bold" }}
            title={`Origen: ${activeTrip.origin}`}
          />
        )}
        {!activeTrip && previewCoords?.originCoords && (
          <Marker
            position={previewCoords.originCoords}
            label={{ text: "A", color: "white", fontWeight: "bold" }}
            title="Origen cotizado"
          />
        )}

        {/* Destino (B) */}
        {activeTrip && activeTrip.destinationCoords && (
          <Marker
            position={activeTrip.destinationCoords}
            label={{ text: "B", color: "black", fontWeight: "bold" }}
            title={`Destino: ${activeTrip.destination}`}
          />
        )}
        {!activeTrip && previewCoords?.destinationCoords && (
          <Marker
            position={previewCoords.destinationCoords}
            label={{ text: "B", color: "black", fontWeight: "bold" }}
            title="Destino cotizado"
          />
        )}

        {/* Marcadores de Choferes Reales desde Firestore (Puntos de Color Verde/Naranja/Gris) */}
        {realDrivers.map((drv) => {
          if (drv.id === assignedDriverId && carPosition) return null;

          // Color del punto: 🟢 Verde Esmeralda (Activo), 🟡 Naranja (En Viaje), 🔴 Gris (En Revisión/Desconectado)
          const dotColor = drv.status === 'Activo' && drv.isOnline ? '#10B981'
            : drv.status === 'En Viaje' ? '#FF7B1A'
            : '#94A3B8';

          return (
            <Marker
              key={drv.id}
              position={{ lat: drv.lat, lng: drv.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: dotColor,
                fillOpacity: 1.0,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              title={`${drv.name} — ${drv.status}`}
              onClick={() => setSelectedDriver(drv)}
            />
          );
        })}

        {/* InfoWindow al hacer clic en el punto de un Chofer */}
        {selectedDriver && (
          <InfoWindow
            position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
            onCloseClick={() => setSelectedDriver(null)}
          >
            <div className="p-2 min-w-[200px] text-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedDriver.status === 'Activo' ? '#10B981' : '#FF7B1A' }} />
                <span className="font-bold text-xs">{selectedDriver.name}</span>
              </div>
              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                <Car className="h-3 w-3 text-slate-400" /> {selectedDriver.vehicle} ({selectedDriver.color})
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                Patente: <strong>{selectedDriver.plate}</strong>
              </p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> {selectedDriver.phone}
              </p>
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {selectedDriver.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
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
