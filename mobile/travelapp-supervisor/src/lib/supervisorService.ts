import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface SupervisorData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  supervisorCode: string;
  downloadUrl: string;
  qrImageUrl: string;
}

export interface FleetMetrics {
  totalRecruited: number;
  activeDriversToday: number;
  fleetRevenueMonth: number;
  companyFee: number;
  supervisorCommission: number;
}

export interface DriverItem {
  id: string;
  name: string;
  email?: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: 'Activo' | 'En Ruta' | 'Inactivo';
  cashBalance: number;
  tripsMonth: number;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
  supervisorId?: string;
  supervisorCode?: string;
  insuranceExpiry?: string;
  licenseExpiry?: string;
  rtoExpiry?: string;
}

export const MASTER_ADMIN_EMAILS = [
  'fernando@travelapp.ar',
  'ferincola@gmail.com',
  'edgar@travelapp.ar',
  'carlos@travelapp.ar',
];

/**
 * Obtiene o inicializa el perfil y código único del supervisor en Firestore
 */
export async function getOrInitSupervisorProfile(): Promise<SupervisorData | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const uid = currentUser.uid;
  const email = (currentUser.email || '').toLowerCase().trim();
  const displayName = currentUser.displayName || (email.includes('@') ? email.split('@')[0] : 'Supervisor');

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    let supervisorCode = '';
    let phone = currentUser.phoneNumber || '';

    if (snap.exists()) {
      const data = snap.data();
      supervisorCode = data.supervisorCode || data.referralCode || '';
      if (data.phone) phone = data.phone;
    }

    // Si aún no tiene código único generado, generamos uno permanente y formal
    if (!supervisorCode) {
      let cleanPrefix = (email.split('@')[0] || displayName).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (cleanPrefix.length < 3) cleanPrefix = 'SUP';
      const cleanSuffix = uid.substring(0, 4).toUpperCase();
      supervisorCode = `SUP-${cleanPrefix.slice(0, 8)}-${cleanSuffix}`;

      await setDoc(userDocRef, {
        supervisorCode,
        role: 'supervisor',
        email,
        name: displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Guardar también en colección supervisores para indexación rápida
      await setDoc(doc(db, 'supervisors', uid), {
        uid,
        name: displayName,
        email,
        phone,
        supervisorCode,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }

    const downloadUrl = `https://travelapp.ar/descargar/conductor?ref=${supervisorCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(downloadUrl)}`;

    return {
      uid,
      name: displayName,
      email,
      phone,
      supervisorCode,
      downloadUrl,
      qrImageUrl,
    };
  } catch (err) {
    console.warn('Error al obtener o inicializar perfil de supervisor:', err);
    // Fallback seguro en memoria con UID real
    const fallbackCode = `SUP-${uid.substring(0, 6).toUpperCase()}`;
    const downloadUrl = `https://travelapp.ar/descargar/conductor?ref=${fallbackCode}`;
    return {
      uid,
      name: displayName,
      email,
      phone: currentUser.phoneNumber || '',
      supervisorCode: fallbackCode,
      downloadUrl,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(downloadUrl)}`,
    };
  }
}

/**
 * Escucha conductores reales de Firestore y computa métricas
 */
export function subscribeToRealFleet(
  supervisorUid: string,
  onDriversUpdate: (drivers: DriverItem[], metrics: FleetMetrics) => void
) {
  const currentUser = auth.currentUser;
  const email = (currentUser?.email || '').toLowerCase().trim();
  const isMaster = MASTER_ADMIN_EMAILS.includes(email);

  const driversRef = collection(db, 'drivers');

  const unsubscribe = onSnapshot(
    driversRef,
    (snapshot) => {
      const allList: DriverItem[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();

        // Si es master admin ve todos; si es supervisor específico, ve los asignados a él o libres
        const isAssigned = isMaster || !d.supervisorId || d.supervisorId === supervisorUid;
        if (!isAssigned) return;

        const isOnline = Boolean(d.isOnline);
        const hasActiveTrip = Boolean(d.currentTripId);
        let status: 'Activo' | 'En Ruta' | 'Inactivo' = 'Inactivo';
        if (isOnline) {
          status = hasActiveTrip ? 'En Ruta' : 'Activo';
        }

        const vehicleObj = d.activeVehicle || d.vehicle || {};
        const vehicleModel = vehicleObj.model 
          ? `${vehicleObj.brand || ''} ${vehicleObj.model}`.trim()
          : (d.vehicleModel || 'Vehículo no registrado');
        const plate = vehicleObj.plate || d.licensePlate || d.plate || 'Sin Patente';

        allList.push({
          id: docSnap.id,
          name: d.name || d.displayName || `${d.firstName || 'Conductor'} ${d.lastName || ''}`.trim() || 'Conductor Registrado',
          email: d.email || '',
          phone: d.phone || d.phoneNumber || '',
          vehicle: `${vehicleModel} (${plate})`,
          plate,
          status,
          cashBalance: Number(d.currentCommissionBalance || d.walletBalance || d.cashBalance || 0),
          tripsMonth: Number(d.tripsCompleted || d.tripsCount || d.tripsMonth || 0),
          isOnline,
          latitude: d.location?.latitude,
          longitude: d.location?.longitude,
          supervisorId: d.supervisorId,
          supervisorCode: d.supervisorCode,
          insuranceExpiry: d.insuranceExpiry || d.docs?.insuranceExpiry,
          licenseExpiry: d.licenseExpiry || d.docs?.licenseExpiry,
          rtoExpiry: d.rtoExpiry || d.docs?.rtoExpiry,
        });
      });

      const totalRecruited = allList.length;
      const activeDriversToday = allList.filter((x) => x.status === 'Activo' || x.status === 'En Ruta').length;

      // Calcular recaudación sumando saldos o viajes
      let fleetRevenueMonth = 0;
      allList.forEach((drv) => {
        if (drv.cashBalance > 0) fleetRevenueMonth += drv.cashBalance;
      });

      const companyFee = fleetRevenueMonth * 0.20; // 20% Fee Empresa
      const supervisorCommission = companyFee * 0.10; // 10% del Fee para el supervisor

      onDriversUpdate(allList, {
        totalRecruited,
        activeDriversToday,
        fleetRevenueMonth,
        companyFee,
        supervisorCommission,
      });
    },
    (err) => {
      console.warn('Error escuchando conductores reales en Firestore:', err);
      onDriversUpdate([], {
        totalRecruited: 0,
        activeDriversToday: 0,
        fleetRevenueMonth: 0,
        companyFee: 0,
        supervisorCommission: 0,
      });
    }
  );

  return unsubscribe;
}
