import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GlobalRewardsConfig } from '@/types/rewards';

export const DEFAULT_REWARDS_CONFIG: GlobalRewardsConfig = {
  universalPointValue: 175,       // $175 ARS por punto (confidencial de Concorde 360)
  welcomePointsBonus: 20,         // 20 Puntos al crear cuenta
  profilePhotoBonusPoints: 10,    // 10 Puntos al cargar foto de perfil
  dailyIssuanceCapPoints: 1000,   // Cupo diario de emisión para marketing
  maxRedemptionPercentPerOrder: 30, // Tope 30% del total de la orden
  minPointsToRedeem: 5,
};

export const REWARDS_CONFIG_DOC = 'rewards_config/global';

/**
 * Obtiene la configuración global de rewards desde Firestore,
 * con fallback a los valores predeterminados seguros.
 */
export async function getGlobalRewardsConfig(): Promise<GlobalRewardsConfig> {
  try {
    const docRef = doc(db, 'rewards_config', 'global');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        universalPointValue: Number(data.universalPointValue ?? data.defaultPointValue ?? DEFAULT_REWARDS_CONFIG.universalPointValue),
        welcomePointsBonus: Number(data.welcomePointsBonus ?? DEFAULT_REWARDS_CONFIG.welcomePointsBonus),
        profilePhotoBonusPoints: Number(data.profilePhotoBonusPoints ?? DEFAULT_REWARDS_CONFIG.profilePhotoBonusPoints),
        dailyIssuanceCapPoints: Number(data.dailyIssuanceCapPoints ?? DEFAULT_REWARDS_CONFIG.dailyIssuanceCapPoints),
        maxRedemptionPercentPerOrder: Number(data.maxRedemptionPercentPerOrder ?? DEFAULT_REWARDS_CONFIG.maxRedemptionPercentPerOrder),
        minPointsToRedeem: Number(data.minPointsToRedeem ?? DEFAULT_REWARDS_CONFIG.minPointsToRedeem),
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
    }
  } catch (err) {
    console.warn('Error fetching global rewards config, using defaults:', err);
  }
  return DEFAULT_REWARDS_CONFIG;
}

/**
 * Guarda o actualiza la configuración global de rewards en Firestore
 */
export async function saveGlobalRewardsConfig(
  configUpdates: Partial<GlobalRewardsConfig>,
  updatedBy: string = 'Concorde 360 Admin'
): Promise<void> {
  const docRef = doc(db, 'rewards_config', 'global');
  await setDoc(
    docRef,
    {
      ...configUpdates,
      updatedAt: Date.now(),
      updatedBy,
    },
    { merge: true }
  );
}

/**
 * Suscripción en tiempo real a la configuración de rewards
 */
export function subscribeGlobalRewardsConfig(
  onUpdate: (config: GlobalRewardsConfig) => void
): () => void {
  const docRef = doc(db, 'rewards_config', 'global');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          universalPointValue: Number(data.universalPointValue ?? data.defaultPointValue ?? DEFAULT_REWARDS_CONFIG.universalPointValue),
          welcomePointsBonus: Number(data.welcomePointsBonus ?? DEFAULT_REWARDS_CONFIG.welcomePointsBonus),
          profilePhotoBonusPoints: Number(data.profilePhotoBonusPoints ?? DEFAULT_REWARDS_CONFIG.profilePhotoBonusPoints),
          dailyIssuanceCapPoints: Number(data.dailyIssuanceCapPoints ?? DEFAULT_REWARDS_CONFIG.dailyIssuanceCapPoints),
          maxRedemptionPercentPerOrder: Number(data.maxRedemptionPercentPerOrder ?? DEFAULT_REWARDS_CONFIG.maxRedemptionPercentPerOrder),
          minPointsToRedeem: Number(data.minPointsToRedeem ?? DEFAULT_REWARDS_CONFIG.minPointsToRedeem),
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        });
      } else {
        onUpdate(DEFAULT_REWARDS_CONFIG);
      }
    },
    (err) => {
      console.warn('Error listening to rewards config, fallback to default:', err);
      onUpdate(DEFAULT_REWARDS_CONFIG);
    }
  );
}
