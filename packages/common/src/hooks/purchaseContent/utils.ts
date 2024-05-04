import { Collection, Track } from '~/models'
import { UserTrackMetadata, isContentUSDCPurchaseGated } from '~/models/Track'
import { Nullable } from '~/utils'

import { useGatedContentAccess } from '../useGatedContent'

import {
  PayExtraAmountPresetValues,
  PayExtraPreset,
  PurchaseableAlbumStreamMetadata,
  PurchaseableContentMetadata,
  PurchaseableTrackDownloadMetadata,
  PurchaseableTrackStreamMetadata
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

export const isPurchaseableAlbum = (
  metadata?: PurchaseableContentMetadata
): metadata is PurchaseableAlbumStreamMetadata =>
  !!metadata &&
  'is_album' in metadata &&
  isContentUSDCPurchaseGated(metadata.stream_conditions)

export const isStreamPurchaseable = (
  metadata: PurchaseableContentMetadata
): metadata is
  | PurchaseableTrackStreamMetadata
  | PurchaseableAlbumStreamMetadata =>
  isContentUSDCPurchaseGated(metadata.stream_conditions)

export const isTrackDownloadPurchaseable = (
  metadata: PurchaseableContentMetadata
): metadata is PurchaseableTrackDownloadMetadata =>
  'download_conditions' in metadata &&
  isContentUSDCPurchaseGated(metadata.download_conditions)

export const useIsGatedContentPlaylistAddable = (
  contentArg?: Nullable<Partial<Track | UserTrackMetadata | Collection>>
) => {
  const content = contentArg ?? {}
  const {
    stream_conditions: streamConditions,
    is_stream_gated: isStreamGated,
    ddex_app: ddexApp
  } = content
  const { hasStreamAccess } = useGatedContentAccess(content)
  return (
    !ddexApp &&
    (!isStreamGated ||
      (isContentUSDCPurchaseGated(streamConditions) && hasStreamAccess))
  )
}
