// ============================================================
// Experience Affiliate & Ambassador Network Types
// TravelApp Experience (Tourism & Memberships)
// ============================================================

export interface ExperiencePartnerTier {
  id: string;
  name: string;                     // e.g. "Starter", "Pro Creator", "Master Partner", "VIP"
  minBookings: number;              // Threshold to reach this tier (e.g. 1, 6, 11, 21)
  maxBookings?: number;             // Upper boundary (optional for top tier)
  commissionPct: number;            // % commission per installment/booking (e.g. 3, 5, 7, 10)
  couponCodePrefix?: string;        // Optional default prefix
  couponDiscountPct?: number;       // Discount % offered to follower/client (e.g. 10%)
  couponDiscountFixed?: number;     // Fixed ARS discount offered to follower/client
  bonusRewardPoints: number;        // TravelApp Rewards points awarded per booking
  badgeColor: string;               // UI badge color (cyan, purple, gold, emerald)
}

export interface ExperiencePartner {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  refCode: string;                  // e.g. "MARIA_TRAVEL"
  currentTierId: string;
  totalBookingsConcreted: number;
  totalCommissionEarned: number;
  walletBalance: number;
  assignedCouponCode: string;       // e.g. "MARIA10OFF"
  assignedCouponDiscountPct: number;
  createdAt: number;
  status: 'active' | 'inactive' | 'pending';
}

export interface InstallmentCommission {
  id: string;
  bookingId: string;
  experienceTitle: string;
  customerName: string;
  partnerId: string;
  partnerName: string;
  tierNameAtTime: string;
  installmentNumber: number;        // e.g. 1 of 3
  totalInstallments: number;
  installmentAmount: number;        // ARS amount of this specific installment
  commissionPctApplied: number;     // % applied at time of payment
  commissionEarned: number;        // ARS commission earned for this installment
  status: 'paid' | 'pending' | 'cancelled';
  paidAt?: number;
}
