export type PremiumContentType = 'track'

export type PremiumContentSignatureData = {
  premiumContentId: number
  premiumContentType: PremiumContentType
  userWallet: string
  timestamp: number
}
