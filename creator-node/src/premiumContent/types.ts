export type PremiumContentType = 'track'

export type PremiumContentSignatureData = {
  premium_content_id: number
  premium_content_type: PremiumContentType
  user_wallet: string
  timestamp: string
}

export enum PremiumContentAccessError {
  MISSING_HEADERS = 'MISSING_HEADERS',
  INVALID_DISCOVERY_NODE = 'INVALID_DISCOVERY_NODE',
  FAILED_MATCH = 'FAILED_MATCH'
}
