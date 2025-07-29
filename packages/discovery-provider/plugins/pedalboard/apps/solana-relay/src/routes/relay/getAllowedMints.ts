import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { config } from '../../config'

const usdcMintAddress = config.usdcMintAddress

const db = initializeDiscoveryDb(config.discoveryDbConnectionString)

export const getAllowedMints = async (): Promise<string[]> => {
  const artistCoinMints = await db.select('mint').from('artist_coins')
  return [usdcMintAddress, ...artistCoinMints]
}
