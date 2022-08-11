import { signatureHasExpired } from '../apiSigning'
import { PremiumContentSignatureData, PremiumContentType } from './types'

type PremiumContentMatchArgs = {
  signedDataFromDiscoveryNode: PremiumContentSignatureData
  userWallet: string
  premiumContentId: number
  premiumContentType: PremiumContentType
  logger?: any
}

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Verify that DN-signed data timestamp is relatively recent.
 * Verify that id and type (track/playlist) of content requested are same as those in the DN-signed data.
 * Verify that wallet from recovered user signature is the same as that of wallet in the DN-signed data.
 * If all these verifications are successful, then we have a match.
 */
export const isPremiumContentMatch = ({
  signedDataFromDiscoveryNode,
  userWallet,
  premiumContentId,
  premiumContentType,
  logger = console
}: PremiumContentMatchArgs) => {
  const {
    premiumContentId: signedPremiumContentId,
    premiumContentType: signedPremiumContentType,
    userWallet: signedUserWallet,
    timestamp: signedTimestamp
  } = signedDataFromDiscoveryNode

  const hasSignatureExpired = signatureHasExpired(
    signedTimestamp,
    PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS
  )
  if (hasSignatureExpired) {
    logger.info(
      `Premium content signature for id ${premiumContentId} and type ${premiumContentType} is too old.`
    )
    return false
  }

  if (signedPremiumContentId !== premiumContentId) {
    logger.info(
      `Premium content ids do not match for type ${premiumContentType}: ${signedPremiumContentId} (signed) vs ${premiumContentId} (requested).`
    )
    return false
  }

  if (signedPremiumContentType !== premiumContentType) {
    logger.info(
      `Premium content types do not match: ${signedPremiumContentType} (signed) vs ${premiumContentType} (requested).`
    )
    return false
  }

  if (signedUserWallet !== userWallet) {
    logger.info(
      `Premium content user wallets do not match: ${signedUserWallet} (signed) vs ${userWallet} (requested).`
    )
    return false
  }

  return true
}
