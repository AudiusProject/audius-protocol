import { UserTrackMetadata, isContentUSDCPurchaseGated } from 'models/Track'

import {
  PayExtraAmountPresetValues,
  PayExtraPreset,
  PurchaseableTrackMetadata
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

export const isTrackStreamPurchaseable = (
  track: UserTrackMetadata
): track is PurchaseableTrackMetadata =>
  isContentUSDCPurchaseGated(track.stream_conditions)

export const isTrackDownloadPurchaseable = (
  track: UserTrackMetadata
): track is PurchaseableTrackMetadata =>
  isContentUSDCPurchaseGated(track.download_conditions)
