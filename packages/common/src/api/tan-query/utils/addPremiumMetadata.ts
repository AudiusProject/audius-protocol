import BN from 'bn.js'

import {
  isContentUSDCPurchaseGated,
  USDCPurchaseConditions
} from '~/models/Track'
import type { Track } from '~/models/Track'

// Constants from the saga implementation
const BN_USDC_CENT_WEI = new BN(10).pow(new BN(16))

/**
 * Adds premium metadata to a track's stream and download conditions
 * This is a non-saga version of the addPremiumMetadata function from the saga implementation
 */
export const addPremiumMetadata = async <T extends Partial<Track>>(
  track: T,
  wallet?: string,
  userBank?: string
): Promise<T> => {
  if (!wallet) return track

  const updatedTrack = { ...track }

  // download_conditions could be set separately from stream_conditions, so we check for them first
  if (isContentUSDCPurchaseGated(updatedTrack.download_conditions)) {
    updatedTrack.download_conditions = await getUSDCMetadata(
      updatedTrack.download_conditions,
      wallet,
      userBank
    )
  }

  if (isContentUSDCPurchaseGated(updatedTrack.stream_conditions)) {
    updatedTrack.stream_conditions = await getUSDCMetadata(
      updatedTrack.stream_conditions,
      wallet,
      userBank
    )

    // If stream_conditions are set, download_conditions should always match
    updatedTrack.download_conditions = await getUSDCMetadata(
      updatedTrack.stream_conditions,
      wallet,
      userBank
    )
  }

  return updatedTrack
}

/**
 * Gets USDC metadata for a track's conditions
 * This is a non-saga version of the getUSDCMetadata function from the saga implementation
 */
const getUSDCMetadata = async (
  conditions: USDCPurchaseConditions,
  wallet: string,
  userBank?: string
): Promise<USDCPurchaseConditions> => {
  const ownerUserbank = userBank ?? wallet
  const priceCents = conditions.usdc_purchase.price
  const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()

  const conditionsWithMetadata: USDCPurchaseConditions = {
    usdc_purchase: {
      price: priceCents,
      splits: {
        [ownerUserbank?.toString() ?? '']: priceWei
      }
    }
  }

  return conditionsWithMetadata
}
