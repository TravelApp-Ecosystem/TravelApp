import { FleetSupervisorConfig } from '@/types/partners';
import { ExperiencePartnerTier, ExperiencePartner, InstallmentCommission } from '@/types/affiliates';

// Default Tier Matrix (Editable from Marketing Panel)
export const DEFAULT_EXPERIENCE_TIERS: ExperiencePartnerTier[] = [
  {
    id: 'tier-1',
    name: 'Level 1: Starter',
    minBookings: 1,
    maxBookings: 5,
    commissionPct: 3.0,
    couponDiscountPct: 0,
    bonusRewardPoints: 100,
    badgeColor: 'cyan',
  },
  {
    id: 'tier-2',
    name: 'Level 2: Pro Creator',
    minBookings: 6,
    maxBookings: 10,
    commissionPct: 5.0,
    couponDiscountPct: 10,
    bonusRewardPoints: 250,
    badgeColor: 'purple',
  },
  {
    id: 'tier-3',
    name: 'Level 3: Master Partner',
    minBookings: 11,
    maxBookings: 20,
    commissionPct: 7.0,
    couponDiscountPct: 15,
    bonusRewardPoints: 500,
    badgeColor: 'gold',
  },
  {
    id: 'tier-4',
    name: 'Level 4: VIP Ambassador',
    minBookings: 21,
    commissionPct: 10.0,
    couponDiscountPct: 20,
    bonusRewardPoints: 1000,
    badgeColor: 'emerald',
  },
];

/**
 * Calculates Fleet Supervisor Commission based on Company Fee
 * Example:
 *  - Driver fare: $100.000
 *  - Company Fee Rate: 20% ($20.000)
 *  - Supervisor Rate: 10% of Company Fee ($2.000)
 */
export function calculateFleetSupervisorCommission(
  fareAmount: number,
  companyFeePct: number = 20,
  supervisorCompanyFeePct: number = 10
): { companyFeeAmount: number; supervisorCommissionAmount: number; netCompanyRevenue: number } {
  const companyFeeAmount = (fareAmount * companyFeePct) / 100;
  const supervisorCommissionAmount = (companyFeeAmount * supervisorCompanyFeePct) / 100;
  const netCompanyRevenue = companyFeeAmount - supervisorCommissionAmount;

  return {
    companyFeeAmount,
    supervisorCommissionAmount,
    netCompanyRevenue,
  };
}

/**
 * Determines current Experience Partner Tier based on total bookings completed
 */
export function getPartnerTier(
  totalBookings: number,
  tiers: ExperiencePartnerTier[] = DEFAULT_EXPERIENCE_TIERS
): ExperiencePartnerTier {
  const sorted = [...tiers].sort((a, b) => b.minBookings - a.minBookings);
  for (const tier of sorted) {
    if (totalBookings >= tier.minBookings) {
      return tier;
    }
  }
  return tiers[0];
}

/**
 * Calculates the commission for a specific installment payment
 */
export function calculateInstallmentCommission(
  installmentAmount: number,
  commissionPct: number
): number {
  return (installmentAmount * commissionPct) / 100;
}
