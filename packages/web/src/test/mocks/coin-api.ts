import { developmentConfig, stagingConfig, productionConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'

import { env } from 'services/env'

// TypeScript interfaces for wallet API types
export interface ArtistCoin {
  ticker: string
  mint: string
  user_id: string
  created_at: string
  members: number
  members_24h_change_percent: number
  token_info: {
    price: number
    price_change_24h: number
    market_cap: number
    volume_24h: number
    supply: number
    holders: number
  }
}

export interface CoinMember {
  user_id: string
  balance: number
}

export interface UserCoin {
  ticker: string
  mint: string
  balance: number
  balance_usd: number
}

export interface GetUsersCoinsQueryParams {
  limit?: number
  offset?: number
}

export interface GetCoinMembersQueryParams {
  min_balance?: number
  sort_direction?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Get the correct API endpoint based on environment
const getApiEndpoint = () => {
  const environment = env.ENVIRONMENT || 'development'

  switch (environment) {
    case 'production':
      return productionConfig.network.apiEndpoint
    case 'staging':
      return stagingConfig.network.apiEndpoint
    default:
      return developmentConfig.network.apiEndpoint
  }
}

const apiEndpoint = getApiEndpoint()

// Mock data for coin API endpoints
export const mockWalletData = {
  // Mock data for /v1/coin/:mint endpoint
  artistCoin: {
    data: {
      ticker: 'TEST',
      mint: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      user_id: 'eAZl3',
      created_at: '2024-01-01T00:00:00.000Z',
      members: 150,
      members_24h_change_percent: 5.2,
      token_info: {
        price: 0.25,
        price_change_24h: 0.05,
        market_cap: 1000000,
        volume_24h: 50000,
        supply: 4000000,
        holders: 150
      }
    }
  },

  // Mock data for /v1/coins endpoint - list of artist coins
  artistCoins: {
    data: [
      {
        ticker: 'AUDIO',
        mint: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
        owner_id: 'eAUD1',
        created_at: '2023-01-01T00:00:00.000Z',
        members: 25000,
        members_24h_change_percent: 2.5,
        token_info: {
          address: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
          decimals: 8,
          symbol: 'AUDIO',
          name: 'Audius',
          marketCap: 150000000,
          fdv: 200000000,
          extensions: {
            coingeckoId: 'audius',
            description: 'Audius is a decentralized music streaming protocol',
            twitter: 'https://twitter.com/audius',
            website: 'https://audius.co',
            discord: 'https://discord.gg/audius'
          },
          logoURI: '/img/tokenLogos/audio.svg',
          liquidity: 5000000,
          lastTradeUnixTime: 1640995200,
          lastTradeHumanTime: '2024-01-01T00:00:00Z',
          price: 0.15,
          history24hPrice: 0.14,
          priceChange24hPercent: 7.14,
          uniqueWallet24h: 1250,
          uniqueWalletHistory24h: 1200,
          uniqueWallet24hChangePercent: 4.17,
          totalSupply: 1000000000,
          circulatingSupply: 750000000,
          holder: 25000,
          trade24h: 850,
          tradeHistory24h: 820,
          trade24hChangePercent: 3.66,
          sell24h: 425,
          sellHistory24h: 410,
          sell24hChangePercent: 3.66,
          buy24h: 425,
          buyHistory24h: 410,
          buy24hChangePercent: 3.66,
          v24h: 2500000,
          v24hUSD: 375000,
          vHistory24h: 2400000,
          vHistory24hUSD: 336000,
          v24hChangePercent: 4.17,
          vBuy24h: 1250000,
          vBuy24hUSD: 187500,
          vBuyHistory24h: 1200000,
          vBuyHistory24hUSD: 168000,
          vBuy24hChangePercent: 4.17,
          vSell24h: 1250000,
          vSell24hUSD: 187500,
          vSellHistory24h: 1200000,
          vSellHistory24hUSD: 168000,
          vSell24hChangePercent: 4.17,
          numberMarkets: 12
        }
      },
      {
        ticker: 'BONK',
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        owner_id: 'eBONK',
        created_at: '2023-06-01T00:00:00.000Z',
        members: 15000,
        members_24h_change_percent: 8.2,
        token_info: {
          address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
          decimals: 5,
          symbol: 'BONK',
          name: 'Bonk',
          marketCap: 500000000,
          fdv: 750000000,
          extensions: {
            coingeckoId: 'bonk',
            description:
              'The first Solana dog coin for the people, by the people',
            twitter: 'https://twitter.com/bonk_inu',
            website: 'https://bonkcoin.com',
            discord: 'https://discord.gg/bonk'
          },
          logoURI: '/img/tokenLogos/bonk.svg',
          liquidity: 2000000,
          lastTradeUnixTime: 1640995200,
          lastTradeHumanTime: '2024-01-01T00:00:00Z',
          price: 0.000015,
          history24hPrice: 0.000014,
          priceChange24hPercent: 7.14,
          uniqueWallet24h: 850,
          uniqueWalletHistory24h: 800,
          uniqueWallet24hChangePercent: 6.25,
          totalSupply: 93000000000000,
          circulatingSupply: 69000000000000,
          holder: 15000,
          trade24h: 650,
          tradeHistory24h: 620,
          trade24hChangePercent: 4.84,
          sell24h: 325,
          sellHistory24h: 310,
          sell24hChangePercent: 4.84,
          buy24h: 325,
          buyHistory24h: 310,
          buy24hChangePercent: 4.84,
          v24h: 1500000,
          v24hUSD: 22500,
          vHistory24h: 1400000,
          vHistory24hUSD: 19600,
          v24hChangePercent: 7.14,
          vBuy24h: 750000,
          vBuy24hUSD: 11250,
          vBuyHistory24h: 700000,
          vBuyHistory24hUSD: 9800,
          vBuy24hChangePercent: 7.14,
          vSell24h: 750000,
          vSell24hUSD: 11250,
          vSellHistory24h: 700000,
          vSellHistory24hUSD: 9800,
          vSell24hChangePercent: 7.14,
          numberMarkets: 8
        }
      },
      {
        ticker: 'USDC',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        owner_id: 'eUSDC',
        created_at: '2023-03-01T00:00:00.000Z',
        members: 50000,
        members_24h_change_percent: 1.2,
        token_info: {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          decimals: 6,
          symbol: 'USDC',
          name: 'USD Coin',
          marketCap: 25000000000,
          fdv: 25000000000,
          extensions: {
            coingeckoId: 'usd-coin',
            description: 'USD Coin is a fully-backed US dollar stablecoin',
            twitter: 'https://twitter.com/centre_io',
            website: 'https://www.centre.io',
            discord: ''
          },
          logoURI: '/img/tokenLogos/usdc.svg',
          liquidity: 15000000,
          lastTradeUnixTime: 1640995200,
          lastTradeHumanTime: '2024-01-01T00:00:00Z',
          price: 1.0,
          history24hPrice: 0.999,
          priceChange24hPercent: 0.1,
          uniqueWallet24h: 2500,
          uniqueWalletHistory24h: 2450,
          uniqueWallet24hChangePercent: 2.04,
          totalSupply: 25000000000,
          circulatingSupply: 25000000000,
          holder: 50000,
          trade24h: 1850,
          tradeHistory24h: 1800,
          trade24hChangePercent: 2.78,
          sell24h: 925,
          sellHistory24h: 900,
          sell24hChangePercent: 2.78,
          buy24h: 925,
          buyHistory24h: 900,
          buy24hChangePercent: 2.78,
          v24h: 75000000,
          v24hUSD: 75000000,
          vHistory24h: 72000000,
          vHistory24hUSD: 71928000,
          v24hChangePercent: 4.17,
          vBuy24h: 37500000,
          vBuy24hUSD: 37500000,
          vBuyHistory24h: 36000000,
          vBuyHistory24hUSD: 35964000,
          vBuy24hChangePercent: 4.17,
          vSell24h: 37500000,
          vSell24hUSD: 37500000,
          vSellHistory24h: 36000000,
          vSellHistory24hUSD: 35964000,
          vSell24hChangePercent: 4.17,
          numberMarkets: 25
        }
      }
    ]
  },

  // Mock data for /v1/coins/:mint/members endpoint
  coinMembers: {
    data: [
      {
        user_id: 'eARNR',
        balance: 10000
      },
      {
        user_id: 'wLWkL',
        balance: 9500
      },
      {
        user_id: 'D809W',
        balance: 9000
      },
      {
        user_id: '5epYn',
        balance: 8500
      },
      {
        user_id: '07wAJpk',
        balance: 8000
      },
      {
        user_id: 'nV59e',
        balance: 7500
      },
      {
        user_id: 'no8XL',
        balance: 7000
      },
      {
        user_id: 'DrAOL',
        balance: 6500
      },
      {
        user_id: 'ebGKn',
        balance: 6000
      },
      {
        user_id: 'epYKn',
        balance: 5500
      },
      {
        user_id: 'LMZjD',
        balance: 5000
      },
      {
        user_id: 'ezbPe',
        balance: 4500
      },
      {
        user_id: 'ngNmq',
        balance: 4000
      },
      {
        user_id: 'DNBEw',
        balance: 3500
      },
      {
        user_id: '51Aq2',
        balance: 3000
      },
      {
        user_id: 'nkPKL',
        balance: 2800
      },
      {
        user_id: 'ebWQP',
        balance: 2600
      },
      {
        user_id: 'D2p1n',
        balance: 2400
      },
      {
        user_id: 'epVBL',
        balance: 2200
      },
      {
        user_id: 'D9p2L',
        balance: 2000
      },
      {
        user_id: 'DO6RL',
        balance: 1800
      },
      {
        user_id: 'DX94Z',
        balance: 1600
      },
      {
        user_id: 'DvqmL',
        balance: 1400
      },
      {
        user_id: 'eYPzm',
        balance: 1200
      },
      {
        user_id: 'BZk61',
        balance: 1000
      },
      {
        user_id: 'DNyKQ',
        balance: 900
      },
      {
        user_id: 'ep2KL',
        balance: 800
      },
      {
        user_id: 'nl13K',
        balance: 700
      },
      {
        user_id: 'eGlEn',
        balance: 600
      },
      {
        user_id: 'Lw81D',
        balance: 500
      }
    ]
  },

  // Mock data for /v1/users/:userId/coins endpoint
  userCoins: {
    data: [
      {
        ticker: 'AUDIO',
        mint: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        balance: 1000.5,
        balance_usd: 250.125
      },
      {
        ticker: 'TEST',
        mint: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        balance: 500.25,
        balance_usd: 125.0625
      },
      {
        ticker: 'COIN',
        mint: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        balance: 200.75,
        balance_usd: 50.1875
      },
      {
        ticker: 'TOKEN',
        mint: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        balance: 100.125,
        balance_usd: 25.03125
      },
      {
        ticker: 'MINT',
        mint: '0x1111111111111111111111111111111111111111111111111111111111111111',
        balance: 50.5,
        balance_usd: 12.625
      }
    ]
  },

  // Mock data for /v1/users/:userId/coins/:mint endpoint
  userCoin: {
    data: {
      ticker: 'AUDIO',
      mint: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      balance: 1000.5,
      balance_usd: 250.125
    }
  }
}

// MSW handlers for coin API endpoints
export const coinApiHandlers = [
  // GET /v1/coins - Get Artist Coins List
  http.get(`${apiEndpoint}/v1/coins`, ({ request }) => {
    const url = new URL(request.url)

    // Parse query parameters
    const mints = url.searchParams.getAll('mint')
    const ownerIds = url.searchParams.getAll('owner_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return HttpResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return HttpResponse.json(
        { error: 'offset must be >= 0' },
        { status: 400 }
      )
    }

    // Filter coins based on query parameters
    let filteredCoins = mockWalletData.artistCoins.data

    if (mints.length > 0) {
      filteredCoins = filteredCoins.filter((coin) => mints.includes(coin.mint))
    }

    if (ownerIds.length > 0) {
      filteredCoins = filteredCoins.filter((coin) =>
        ownerIds.includes(coin.owner_id)
      )
    }

    // Apply pagination
    const paginatedCoins = filteredCoins.slice(offset, offset + limit)

    return HttpResponse.json({
      data: paginatedCoins
    })
  }),

  // GET /v1/coin/:mint - Get Artist Coin Information
  http.get(`${apiEndpoint}/v1/coin/:mint`, ({ params }) => {
    const { mint } = params

    if (!mint) {
      return HttpResponse.json(
        { error: 'mint parameter is required' },
        { status: 400 }
      )
    }

    // Return mock coin data for any mint
    return HttpResponse.json(mockWalletData.artistCoin)
  }),

  // GET /v1/coins/:mint/members - Get Coin Members
  http.get(`${apiEndpoint}/v1/coins/:mint/members`, ({ params, request }) => {
    const { mint } = params
    const url = new URL(request.url)

    if (!mint) {
      return HttpResponse.json(
        { error: 'mint parameter is required' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const minBalance = parseInt(url.searchParams.get('min_balance') || '1')
    const sortDirection = url.searchParams.get('sort_direction') || 'desc'
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Validate parameters
    if (minBalance < 0) {
      return HttpResponse.json(
        { error: 'min_balance must be >= 0' },
        { status: 400 }
      )
    }

    if (!['asc', 'desc'].includes(sortDirection)) {
      return HttpResponse.json(
        { error: 'sort_direction must be either "asc" or "desc"' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return HttpResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return HttpResponse.json(
        { error: 'offset must be >= 0' },
        { status: 400 }
      )
    }

    // Filter members based on min_balance
    const filteredMembers = mockWalletData.coinMembers.data.filter(
      (member) => member.balance >= minBalance
    )

    // Sort members based on sort_direction
    if (sortDirection === 'asc') {
      filteredMembers.sort((a, b) => a.balance - b.balance)
    } else {
      filteredMembers.sort((a, b) => b.balance - a.balance)
    }

    // Apply pagination
    const paginatedMembers = filteredMembers.slice(offset, offset + limit)

    return HttpResponse.json({
      data: paginatedMembers
    })
  }),

  // GET /v1/users/:userId/coins - Get User Coins
  http.get(`${apiEndpoint}/v1/users/:userId/coins`, ({ params, request }) => {
    const { userId } = params
    const url = new URL(request.url)

    if (!userId) {
      return HttpResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    // Parse query parameters
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return HttpResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return HttpResponse.json(
        { error: 'offset must be >= 0' },
        { status: 400 }
      )
    }

    // Apply pagination to user coins data
    const paginatedCoins = mockWalletData.userCoins.data.slice(
      offset,
      offset + limit
    )

    return HttpResponse.json({
      data: paginatedCoins
    })
  }),

  // GET /v1/users/:userId/coins/:mint - Get User Coin for a Specific Mint
  http.get(`${apiEndpoint}/v1/users/:userId/coins/:mint`, ({ params }) => {
    const { userId, mint } = params

    if (!userId) {
      return HttpResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    if (!mint) {
      return HttpResponse.json(
        { error: 'mint parameter is required' },
        { status: 400 }
      )
    }

    // Find the user coin by userId and mint
    const userCoin = mockWalletData.userCoins.data.find(
      (coin) => coin.mint === mint
    )

    if (!userCoin) {
      return HttpResponse.json(
        { error: 'User coin not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(mockWalletData.userCoin)
  })
]

// Helper function to use these handlers in tests
export const useCoinApiMocks = () => {
  return coinApiHandlers
}
