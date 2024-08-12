import { PublicKey } from '@solana/web3.js'

import { TokenName } from '../services'

export const parseMintToken = (
  mint: PublicKey | TokenName,
  mints: Partial<Record<TokenName, PublicKey>>
) => {
  const mintKey = mint instanceof PublicKey ? mint : mints[mint]
  if (!mintKey) {
    throw Error('Mint not configured')
  }
  const mintName =
    mint instanceof PublicKey
      ? (Object.entries(mints).find(
          (m) => !!m[1] && mintKey.equals(m[1])
        )?.[0] as TokenName | undefined)
      : mint
  if (!mintName) {
    throw Error('Mint not configured')
  }
  return { mintKey, mintName }
}
