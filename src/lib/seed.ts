import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Lead } from '@/types/crm';

export const seedLeadsData = async () => {
  // Verificamos si ya hay datos para no duplicar en caso de clic accidental
  const leadsRef = collection(db, 'leads');
  const snapshot = await getDocs(leadsRef);
  
  if (!snapshot.empty) {
    alert("Ya existen leads en la base de datos. Seed cancelado.");
    return;
  }

  const mockLeads: Omit<Lead, 'id'>[] = [
    {
      customerName: 'Carlos Mendoza',
      status: 'Nuevos',
      customerStatus: 'Prospecto',
      customerLevel: 1,
      origin: 'WhatsApp',
      businessUnit: 'TravelCab',
      chatHistory: [
        { sender: 'Travis', message: '¡Hola Carlos! Bienvenido a TravelCab. ¿Para cuándo necesitas tu traslado corporativo?', timestamp: Date.now() - 3600000 },
        { sender: 'Client', message: 'Hola. Lo necesito para mañana a las 8 AM al aeropuerto.', timestamp: Date.now() - 3500000 },
        { sender: 'Travis', message: '¡Perfecto! Un agente te confirmará la tarifa en breve. Si lo prefieres, podemos agendar una llamada rápida para cerrar los detalles.', timestamp: Date.now() - 3400000 }
      ]
    },
    {
      customerName: 'Laura Gómez',
      status: 'Agendados',
      customerStatus: 'Prospecto',
      customerLevel: 1,
      origin: 'Web',
      businessUnit: 'Experiencias',
      chatHistory: [
        { sender: 'Travis', message: 'Hola Laura, vimos tu interés en las experiencias corporativas. ¿Para cuántas personas sería el evento?', timestamp: Date.now() - 86400000 },
        { sender: 'Client', message: 'Hola, somos un equipo de 15 personas. Queríamos algo de team building.', timestamp: Date.now() - 86000000 },
        { sender: 'Travis', message: 'Excelente. Te propongo agendar una videollamada para mostrarte las opciones de Team Building en estancias. ¿Te viene bien mañana?', timestamp: Date.now() - 85000000 },
        { sender: 'Client', message: 'Sí, dale. A las 10 AM.', timestamp: Date.now() - 84000000 }
      ]
    },
    {
      customerName: 'Diego Ríos',
      status: 'En Negociación',
      customerStatus: 'Prospecto',
      customerLevel: 1,
      origin: 'WhatsApp',
      businessUnit: 'Rewards',
      chatHistory: [
        { sender: 'Travis', message: 'Hola Diego, ¿quieres conocer cómo TravelApp Rewards puede incentivar a tu equipo?', timestamp: Date.now() - 172800000 },
        { sender: 'Client', message: 'Me interesa. ¿Tienen algún PDF con los planes?', timestamp: Date.now() - 170000000 },
        { sender: 'Travis', message: 'Por supuesto. Aquí tienes el enlace al dossier. También he avisado a nuestro equipo comercial para que te hagan una propuesta a medida.', timestamp: Date.now() - 160000000 }
      ]
    }
  ];

  try {
    for (const lead of mockLeads) {
      await addDoc(leadsRef, lead);
    }
    alert("Seed data insertado correctamente (3 prospectos).");
  } catch (error) {
    console.error("Error seeding data:", error);
    alert("Hubo un error al insertar los datos. Revisa la consola.");
  }
};
