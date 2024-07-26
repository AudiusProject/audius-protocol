export enum PurchaseMethod {
  WALLET = 'wallet',
  BALANCE = 'balance',
  CARD = 'card',
  CRYPTO = 'crypto'
}

export enum PurchaseVendor {
  STRIPE = 'Stripe',
  COINFLOW = 'Coinflow'
}

export enum PurchaseAccess {
  STREAM = 'stream',
  DOWNLOAD = 'download'
}

export type GatedContentStatus = null | 'UNLOCKING' | 'UNLOCKED' | 'LOCKED'
