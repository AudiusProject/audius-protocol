import { MintName } from 'services/index'
import { OnRampProvider } from 'store/ui/buy-audio/types'

export type BuyCryptoConfig = {
  /**
   * The maximum amount of the token allowed to be purchased
   * in user friendly decimal denomination
   */
  maxAmount: number
  /**
   * The minimum amount of the token allowed to be purchased
   * in user friendly decimal denomination
   */
  minAmount: number
  /**
   * The maximum slippage tolerance for the swap, in percentage basis points
   * (1 bps = 0.01%)
   */
  slippageBps: number
  /**
   * The time to wait between balance change polls, in milliseconds
   */
  retryDelayMs?: number
  /**
   * The number of times to poll for balance changes
   */
  maxRetryCount?: number
}

export enum BuyCryptoErrorCode {
  BAD_AMOUNT = 'BadAmount',
  BAD_TOKEN = 'BadToken',
  BAD_PROVIDER = 'BadProvider',
  BAD_FEE_PAYER = 'BadFeePayer',
  SWAP_ERROR = 'SwapError',
  INSUFFICIENT_FUNDS_ERROR = 'InsufficientFunds',
  ON_RAMP_ERROR = 'OnRampError',
  COUNTRY_NOT_SUPPORTED = 'CountryNotSupported',
  UNKNOWN = 'UnknownError'
}

export class BuyCryptoError extends Error {
  name = 'BuyCryptoError'
  constructor(public code: BuyCryptoErrorCode, message: string) {
    super(`${code}: ${message}`)
  }
}

export type BuyCryptoViaSolLocalStorageState = {
  amount: number
  mint: MintName
  provider: OnRampProvider
  createdAt: number
  intendedLamports: number
}
