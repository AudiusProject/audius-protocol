import type Logger from 'bunyan'
import { PremiumContentSignatureData, PremiumContentType } from './types'

type PremiumContentMatchArgs = {
  signedDataFromDiscoveryNode: PremiumContentSignatureData
  userWallet: string
  premiumContentId: number
  premiumContentType: PremiumContentType
  logger?: any
}

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

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

  const isSignatureTooOld =
    Date.now() - signedTimestamp >= PREMIUM_CONTENT_SIGNATURE_MAX_TTL_MS
  if (isSignatureTooOld) {
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
