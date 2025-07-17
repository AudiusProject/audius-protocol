import React, { useState } from 'react'

import { developmentConfig, stagingConfig, productionConfig } from '@audius/sdk'

// Import MSW browser setup
import '../test/mocks/browser'

// Get the correct API endpoint based on environment
const getApiEndpoint = () => {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production':
      return productionConfig.network.apiEndpoint
    case 'staging':
      return stagingConfig.network.apiEndpoint
    case 'development':
    default:
      return developmentConfig.network.apiEndpoint
  }
}

const apiEndpoint = getApiEndpoint()

interface CoinData {
  ticker: string
  mint: string
  user_id: string
  created_at: string
  members: number
  members_24h_change_percent: number
}

interface CoinMember {
  user_id: string
  balance: number
}

interface UserCoin {
  ticker: string
  mint: string
  balance: number
  balance_usd: number
}

interface CoinApiResponse {
  data: CoinData
}

interface CoinMembersApiResponse {
  data: CoinMember[]
}

interface UserCoinsApiResponse {
  data: UserCoin[]
}

interface UserCoinApiResponse {
  data: UserCoin
}

const WalletApiTest: React.FC = () => {
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  const [coinMembers, setCoinMembers] = useState<CoinMember[] | null>(null)
  const [userCoins, setUserCoins] = useState<UserCoin[] | null>(null)
  const [userCoin, setUserCoin] = useState<UserCoin | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enable mocks when component mounts
  const testCoinEndpoint = async () => {
    setLoading(true)
    setError(null)
    setCoinMembers(null)
    setUserCoins(null)
    setUserCoin(null)

    try {
      const testMint =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const response = await fetch(`${apiEndpoint}/v1/coin/${testMint}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CoinApiResponse = await response.json()
      setCoinData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testCoinMembersEndpoint = async () => {
    setLoading(true)
    setError(null)
    setCoinData(null)
    setUserCoins(null)
    setUserCoin(null)

    try {
      const testMint =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const response = await fetch(
        `${apiEndpoint}/v1/coins/${testMint}/members?limit=5&sort_direction=desc`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CoinMembersApiResponse = await response.json()
      setCoinMembers(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testUserCoinsEndpoint = async () => {
    setLoading(true)
    setError(null)
    setCoinData(null)
    setCoinMembers(null)
    setUserCoin(null)

    try {
      const testUserId = 'eAZl3'
      const response = await fetch(
        `${apiEndpoint}/v1/users/${testUserId}/coins?limit=3&offset=0`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: UserCoinsApiResponse = await response.json()
      setUserCoins(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testUserCoinEndpoint = async () => {
    setLoading(true)
    setError(null)
    setCoinData(null)
    setCoinMembers(null)
    setUserCoins(null)

    try {
      const testUserId = 'eAZl3'
      const testMint =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      const response = await fetch(
        `${apiEndpoint}/v1/users/${testUserId}/coins/${testMint}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: UserCoinApiResponse = await response.json()
      setUserCoin(result.data) // Set single user coin
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Wallet API Mock Test</h2>

      <div
        style={{
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px'
        }}
      >
        <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
        <br />
        <strong>API Endpoint:</strong> {apiEndpoint}
        <br />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={testCoinEndpoint}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test Coin API'}
        </button>

        <button
          onClick={testCoinMembersEndpoint}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test Coin Members'}
        </button>

        <button
          onClick={testUserCoinsEndpoint}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test User Coins'}
        </button>

        <button
          onClick={testUserCoinEndpoint}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test User Coin'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {coinData && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            border: '1px solid #c3e6cb'
          }}
        >
          <h3>✅ Coin API Mock Response Received!</h3>
          <pre
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}
          >
            {JSON.stringify(coinData, null, 2)}
          </pre>
        </div>
      )}

      {coinMembers && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            borderRadius: '4px',
            border: '1px solid #bee5eb'
          }}
        >
          <h3>✅ Coin Members Mock Response Received!</h3>
          <pre
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}
          >
            {JSON.stringify(coinMembers, null, 2)}
          </pre>
        </div>
      )}

      {userCoins && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            border: '1px solid #ffeaa7'
          }}
        >
          <h3>✅ User Coins Mock Response Received!</h3>
          <pre
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}
          >
            {JSON.stringify(userCoins, null, 2)}
          </pre>
        </div>
      )}

      {userCoin && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e2f0d9',
            color: '#155724',
            borderRadius: '4px',
            border: '1px solid #c3e6cb'
          }}
        >
          <h3>✅ User Coin Mock Response Received!</h3>
          <pre
            style={{
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px'
            }}
          >
            {JSON.stringify(userCoin, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default WalletApiTest
