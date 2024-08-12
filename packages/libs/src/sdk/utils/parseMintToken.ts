import { PublicKey } from '@solana/web3.js'

import { TokenName } from '../services'

/**
 * Helper function to get both the token and mint address from one or the other.
 * @param mintOrToken either the name of the token ('USDC') or its mint address
 * @param mints a mapping of tokens to mint addresses
 * @returns the mint address and token name
 * @throws if the token isn't in the mint map
 */
export const parseMintToken = (
  mintOrToken: PublicKey | TokenName,
  mints: Partial<Record<TokenName, PublicKey>>
) => {
  const mint =
    mintOrToken instanceof PublicKey ? mintOrToken : mints[mintOrToken]
  if (!mint) {
    throw Error('Mint not configured')
  }
  const token =
    mintOrToken instanceof PublicKey
      ? (Object.entries(mints).find((m) => !!m[1] && mint.equals(m[1]))?.[0] as
          | TokenName
          | undefined)
      : mintOrToken
  if (!token) {
    throw Error('Mint not configured')
  }
  return { mint, token }
}
