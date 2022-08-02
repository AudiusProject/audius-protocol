import type Logger from 'bunyan'
import { PremiumContentSignatureData, PremiumContentType } from './types'

type PremiumContentMatchArgs = {
  signedDataFromDiscoveryNode: PremiumContentSignatureData
  userWallet: string
  premiumContentId: number
  premiumContentType: PremiumContentType
  logger?: Logger
}

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL = 6 * 60 * 60 * 1000 // 6 hours

export const isPremiumContentMatch = ({
  signedDataFromDiscoveryNode,
  userWallet,
  premiumContentId,
  premiumContentType,
  logger
}: PremiumContentMatchArgs) => {
  const {
    premiumContentId: signedPremiumContentId,
    premiumContentType: signedPremiumContentType,
    userWallet: signedUserWallet,
    timestamp: signedTimestamp
  } = signedDataFromDiscoveryNode

  const theLogger = logger || console

  const isSignatureTooOld =
    Date.now() - signedTimestamp >= PREMIUM_CONTENT_SIGNATURE_MAX_TTL
  if (isSignatureTooOld) {
    theLogger.info(
      `Premium content signature for id ${premiumContentId} and type ${premiumContentType} is too old.`
    )
    return false
  }

  if (signedPremiumContentId !== premiumContentId) {
    theLogger.info(
      `Premium content ids do not match for type ${premiumContentType}: ${signedPremiumContentId} (signed) vs ${premiumContentId} (requested).`
    )
    return false
  }

  if (signedPremiumContentType !== premiumContentType) {
    theLogger.info(
      `Premium content types do not match: ${signedPremiumContentType} (signed) vs ${premiumContentType} (requested).`
    )
    return false
  }

  if (signedUserWallet !== userWallet) {
    theLogger.info(
      `Premium content user wallets do not match: ${signedUserWallet} (signed) vs ${userWallet} (requested).`
    )
    return false
  }

  return true
}
