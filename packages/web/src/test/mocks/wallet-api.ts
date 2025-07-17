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

  // Mock data for /v1/coins/:mint/members endpoint
  coinMembers: {
    data: [
      {
        user_id: 'eAZl3',
        balance: 10000
      },
      {
        user_id: 'eBZm4',
        balance: 8500
      },
      {
        user_id: 'eCAn5',
        balance: 7200
      },
      {
        user_id: 'eDBo6',
        balance: 6500
      },
      {
        user_id: 'eECp7',
        balance: 5800
      },
      {
        user_id: 'eFDq8',
        balance: 5200
      },
      {
        user_id: 'eGEr9',
        balance: 4800
      },
      {
        user_id: 'eHFs0',
        balance: 4200
      },
      {
        user_id: 'eIGt1',
        balance: 3800
      },
      {
        user_id: 'eJHv2',
        balance: 3500
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
export const walletApiHandlers = [
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
export const useWalletApiMocks = () => {
  return walletApiHandlers
}
