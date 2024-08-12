import { PublicKey } from '@solana/web3.js'

import { TokenName } from '../services'

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
