import {
  UserTrackMetadata,
  isPremiumContentUSDCPurchaseGated
} from 'models/Track'

import {
  PayExtraAmountPresetValues,
  PayExtraPreset,
  PurchasableTrackMetadata
} from './types'

type GetExtraAmountArgs = {
  amountPreset: PayExtraPreset
  presetValues: PayExtraAmountPresetValues
  customAmount?: number
}

export const getExtraAmount = ({
  amountPreset,
  presetValues,
  customAmount = 0
}: GetExtraAmountArgs) => {
  let extraAmount = 0
  switch (amountPreset) {
    case PayExtraPreset.LOW:
    case PayExtraPreset.MEDIUM:
    case PayExtraPreset.HIGH:
      extraAmount = presetValues[amountPreset]
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
