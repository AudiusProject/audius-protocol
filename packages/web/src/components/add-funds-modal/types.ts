import { PremiumConditionsUSDCPurchase, UserTrackMetadata } from 'models/Track'

/** Denotes the 3 preset amounts to show on the form, values are in cents. */
export type PayExtraAmountPresetValues = {
  [PayExtraPreset.LOW]: number
  [PayExtraPreset.MEDIUM]: number
  [PayExtraPreset.HIGH]: number
}

export enum PayExtraPreset {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CUSTOM = 'custom',
  NONE = 'none'
}

export type PurchasableTrackMetadata = UserTrackMetadata & {
  premium_conditions: PremiumConditionsUSDCPurchase
}

export type USDCPurchaseConfig = {
  minContentPriceCents: number
  maxContentPriceCents: number
  minUSDCPurchaseAmountCents: number
  maxUSDCPurchaseAmountCents: number
}

export type PurchasePage = 'purchase' | 'crypto-transfer'
