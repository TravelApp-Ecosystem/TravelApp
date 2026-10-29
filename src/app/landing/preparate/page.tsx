import type { Metadata } from "next";
import PreparateTravelAppClient from "./PreparateTravelAppClient";

export const metadata: Metadata = {
  title: "TravelApp | Movete por tu ciudad, acumulá puntos y viajá — 01/11",
  description:
    "El 01/11 nuestro ecosistema estará listo. Registrate para recibir tu acceso prioritario por WhatsApp con Travis y comenzar a sumar puntos en TravelApp Rewards.",
};

export default function PreparateTravelAppPage() {
  return <PreparateTravelAppClient />;
}
