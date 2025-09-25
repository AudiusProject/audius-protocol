import { Coin, coinFromSDK, type CoinMetadata } from '~/adapters'
import { TokenInfo } from '~/store/ui/buy-sell/types'

/**
 * Transform a CoinMetadata to TokenInfo for UI use
 */
const coinMetadataToTokenInfo = (coin: CoinMetadata): TokenInfo => ({
  symbol: coin.ticker ?? '',
  name: (coin.name || coin.ticker?.replace(/^\$/, '')) ?? '',
  decimals: coin.decimals ?? 8,
  balance: null, // This would come from user's wallet state
  address: coin.mint,
  logoURI: coin.logoUri ?? '',
  isStablecoin: false // API tokens are never stablecoins, only USDC is (which is frontend-only)
})

export const transformArtistCoinToTokenInfo = (artistCoin: Coin): TokenInfo => {
  const coinMetadata = coinFromSDK(artistCoin)
  return coinMetadataToTokenInfo(coinMetadata)
}

export const transformArtistCoinsToTokenInfoMap = (
  artistCoins: Coin[]
): Record<string, TokenInfo> => {
  const tokenMap: Record<string, TokenInfo> = {}

  artistCoins.forEach((coin) => {
    const coinMetadata = coinFromSDK(coin)
    const ticker = coinMetadata.ticker || ''
    if (ticker) {
      tokenMap[ticker] = coinMetadataToTokenInfo(coinMetadata)
    }
  })

  return tokenMap
}
