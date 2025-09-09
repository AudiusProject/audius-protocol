import { TokenInfo, TokenPair } from '~/store'

/**
 * Normalizes token symbols by removing $ prefix if present
 */
export const normalizeTokenSymbol = (symbol: string): string => {
  if (!symbol || typeof symbol !== 'string') {
    console.warn('normalizeTokenSymbol: Invalid symbol provided:', symbol)
    return ''
  }
  return symbol.replace(/^\$/, '')
}

/**
 * Creates a fallback token pair for AUDIO/USDC when no pairs are available
 */
export const createFallbackPair = (): TokenPair => ({
  baseToken: {
    symbol: 'AUDIO',
    name: 'Audius',
    decimals: 8,
    balance: null,
    address: '',
    logoURI: '',
    isStablecoin: false
  },
  quoteToken: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    balance: null,
    address: '',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    isStablecoin: true
  },
  exchangeRate: null
})

/**
 * Creates a pair from two token symbols, with fallback if tokens are missing
 */
export const createPairFromSymbols = (
  baseSymbol: string,
  quoteSymbol: string,
  tokens: Record<string, TokenInfo>
): TokenPair | null => {
  const baseToken = findTokenBySymbol(baseSymbol, tokens)
  const quoteToken = findTokenBySymbol(quoteSymbol, tokens)

  if (!baseToken || !quoteToken) return null

  return {
    baseToken,
    quoteToken,
    exchangeRate: null
  }
}

/**
 * Efficiently finds a token by symbol, handling $ prefixes
 */
export const findTokenBySymbol = (
  symbol: string,
  tokens: Record<string, TokenInfo>
): TokenInfo | null => {
  if (!symbol || typeof symbol !== 'string') {
    console.warn('findTokenBySymbol: Invalid symbol provided:', symbol)
    return null
  }

  if (!tokens || typeof tokens !== 'object') {
    console.warn('findTokenBySymbol: Invalid tokens object provided:', tokens)
    return null
  }

  // Try exact match first
  if (tokens[symbol]) return tokens[symbol]

  // Try normalized symbol
  const normalized = normalizeTokenSymbol(symbol)
  if (tokens[normalized]) return tokens[normalized]

  // Try with $ prefix
  if (tokens[`$${normalized}`]) return tokens[`$${normalized}`]

  console.debug(`findTokenBySymbol: Token not found for symbol: ${symbol}`)
  return null
}

/**
 * Finds a token by address
 */
export const findTokenByAddress = (
  address: string,
  tokens: Record<string, TokenInfo>
): TokenInfo | null => {
  if (!address || typeof address !== 'string') {
    console.warn('findTokenByAddress: Invalid address provided:', address)
    return null
  }

  if (!tokens || typeof tokens !== 'object') {
    console.warn('findTokenByAddress: Invalid tokens object provided:', tokens)
    return null
  }

  const token = Object.values(tokens).find((token) => token.address === address)
  if (!token) {
    console.debug(`findTokenByAddress: Token not found for address: ${address}`)
  }
  return token || null
}
