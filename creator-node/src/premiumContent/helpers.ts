import { PremiumContentSignatureData, PremiumContentType } from "./types"

type PremiumContentMatchArgs = {
  signedDataFromDiscoveryNode: PremiumContentSignatureData,
  userWallet: string,
  premiumContentId: number,
  premiumContentType: PremiumContentType
}

const PREMIUM_CONTENT_SIGNATURE_MAX_TTL = 6 * 60 * 60 * 1000 // 6 hours

export const isPremiumContentMatch = ({
  signedDataFromDiscoveryNode,
  userWallet,
  premiumContentId,
  premiumContentType
}: PremiumContentMatchArgs) => {
  const {
    premiumContentId: signedPremiumContentId,
    premiumContentType: signedPremiumContentType,
    userWallet: signedUserWallet,
    timestamp: signedTimestamp
  } = signedDataFromDiscoveryNode
  const isSignatureRecent = Date.now() - signedTimestamp < PREMIUM_CONTENT_SIGNATURE_MAX_TTL
  return signedPremiumContentId === premiumContentId &&
    signedPremiumContentType === premiumContentType &&
    signedUserWallet === userWallet &&
    isSignatureRecent
}
