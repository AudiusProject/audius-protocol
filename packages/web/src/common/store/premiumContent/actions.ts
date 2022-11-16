import { ID, PremiumContentSignature } from '@audius/common'
import { createCustomAction } from 'typesafe-actions'

export const ETH_NFTS_FETCHED = 'PREMIUM_CONTENT/ETH_NFTS_FETCHED'
export const SOL_NFTS_FETCHED = 'PREMIUM_CONTENT/SOL_NFTS_FETCHED'
export const UPDATE_PREMIUM_CONTENT_SIGNATURES =
  'PREMIUM_CONTENT/UPDATE_PREMIUM_CONTENT_SIGNATURES'

export const ethNFTsFetched = createCustomAction(ETH_NFTS_FETCHED, () => ({}))
export const solNFTsFetched = createCustomAction(SOL_NFTS_FETCHED, () => ({}))
export const updatePremiumContentSignatures = createCustomAction(
  UPDATE_PREMIUM_CONTENT_SIGNATURES,
  (signatureMap: { [id: ID]: PremiumContentSignature }) => ({ signatureMap })
)
