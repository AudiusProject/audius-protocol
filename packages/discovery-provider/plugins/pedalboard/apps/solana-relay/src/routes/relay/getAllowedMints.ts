import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { config } from '../../config'
import type { ArtistCoins } from '@pedalboard/storage'

const db = initializeDiscoveryDb(config.discoveryDbConnectionString)

export const getAllowedMints = async (): Promise<string[]> => {
  const rows = await db<ArtistCoins>('artist_coins').select('mint')
  const artistCoinMints = rows.map((row) => row.mint)
  return [config.usdcMintAddress, ...artistCoinMints]
}
