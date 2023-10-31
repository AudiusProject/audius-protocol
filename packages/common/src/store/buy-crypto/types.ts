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
