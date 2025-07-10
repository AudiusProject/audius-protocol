import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

import { config } from '../../config'

const CLAIMABLE_TOKEN_PROGRAM_ID = config.claimableTokenProgramId

// Get token configurations from config
export const getTokenConfigs = () => config.tokens

// Get all supported token addresses
export const getSupportedTokenAddresses = () => {
  const tokens = getTokenConfigs()
  return Object.values(tokens).map((token) => token.address)
}

// Get userbank-enabled token addresses
export const getUserbankTokenAddresses = () => {
  const tokens = getTokenConfigs()
  return Object.values(tokens)
    .filter((token) => token.hasUserbank)
    .map((token) => token.address)
}

// Get Jupiter-enabled token addresses
export const getJupiterTokenAddresses = () => {
  const tokens = getTokenConfigs()
  return Object.values(tokens)
    .filter((token) => token.jupiterEnabled)
    .map((token) => token.address)
}

export const deriveTokenAuthority = (mint: string) =>
  PublicKey.findProgramAddressSync(
    [new PublicKey(mint).toBytes().slice(0, 32)],
    new PublicKey(CLAIMABLE_TOKEN_PROGRAM_ID)
  )[0]

// Get all claimable token authorities dynamically
export const getClaimableTokenAuthorities = () => {
  const tokens = getTokenConfigs()
  const authorities: Record<string, PublicKey> = {}

  Object.entries(tokens).forEach(([symbol, tokenConfig]) => {
    if (tokenConfig.hasUserbank) {
      authorities[symbol] = deriveTokenAuthority(tokenConfig.address)
    }
  })

  return authorities
}

export const deriveUserBank = async (
  ethAddress: string,
  claimableTokenAuthority: PublicKey
) => {
  const ethAddressArray = Uint8Array.from(
    Buffer.from(ethAddress.substring(2), 'hex')
  )
  return await PublicKey.createWithSeed(
    claimableTokenAuthority,
    bs58.encode(ethAddressArray),
    TOKEN_PROGRAM_ID
  )
}

// Get Jupiter-enabled token addresses dynamically
export const getJupiterAllowedMints = () => {
  const jupiterTokens = getJupiterTokenAddresses()
  return jupiterTokens
}