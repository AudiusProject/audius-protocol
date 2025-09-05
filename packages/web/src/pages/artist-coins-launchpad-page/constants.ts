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
  coinSymbol: string
) => `
${coinSymbol} is associated with artist @${artistHandle} on Audius. It aims to attract communities in need of entertainment and connection, embodying the playful and creative spirit of meme culture, and promoting interaction between fans and collectors.`
