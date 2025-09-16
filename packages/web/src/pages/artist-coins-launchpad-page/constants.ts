export const AMOUNT_OF_STEPS = 3

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024 // 15MB

export enum Phase {
  SPLASH,
  SETUP,
  REVIEW,
  BUY_COIN
}

export const LAUNCHPAD_COIN_DESCRIPTION = (
  artistHandle: string,
  coinTicker: string
) => `
${coinTicker} is an artist coin created by ${artistHandle} on Audius. Learn more at https://audius.co/coins/${coinTicker}`

export const SOLANA_DECIMALS = 9

export const MIN_SOL_BALANCE = 20000000 // 0.02 SOL - Minimum amount to launch a coin + a tiny extra for swap fees
