import {
  UserTrackMetadata,
  isPremiumContentUSDCPurchaseGated
} from 'models/Track'

import { payExtraAmountPresetValues } from './constants'
import { PayExtraPreset, PurchasableTrackMetadata } from './types'

export const getExtraAmount = (
  amountPreset: PayExtraPreset,
  customAmount = 0
) => {
  let extraAmount = 0
  switch (amountPreset) {
    case PayExtraPreset.LOW:
    case PayExtraPreset.MEDIUM:
    case PayExtraPreset.HIGH:
      extraAmount = payExtraAmountPresetValues[amountPreset]
      break
    case PayExtraPreset.CUSTOM:
      extraAmount = Number.isFinite(customAmount) ? customAmount : 0
      break
    default:
      break
  }
  return extraAmount
}

export const isTrackPurchasable = (
  track: UserTrackMetadata
): track is PurchasableTrackMetadata =>
  isPremiumContentUSDCPurchaseGated(track.premium_conditions)
