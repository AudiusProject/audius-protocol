import { Keypair } from '@solana/web3.js'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { developmentConfig } from '../../../config/development'
import type { AudiusWalletClient } from '../../AudiusWalletClient'
import type { SolanaWalletAdapter } from '../types'

import { LazyClaimableTokensClient } from './ClaimableTokensClient/LazyClaimableTokensClient'
import { LazySolanaClient } from './LazySolanaClient'
import { LazyPaymentRouterClient } from './PaymentRouterClient/LazyPaymentRouterClient'
import { LazyRewardManagerClient } from './RewardManagerClient/LazyRewardManagerClient'
import type { SolanaClient } from './SolanaClient'

const mocks = vi.hoisted(() => ({
  claimableTokensCtor: vi.fn(),
  deriveUserBank: vi.fn(),
  rewardManagerCtor: vi.fn(),
  getRewardManagerState: vi.fn(),
  paymentRouterCtor: vi.fn(),
  createRouteInstruction: vi.fn(),
  solanaClientCtor: vi.fn(),
  getFeePayer: vi.fn(),
  connection: { rpcEndpoint: 'http://rpc' }
}))

vi.mock('./SolanaClient', () => ({
  SolanaClient: class {
    constructor(config: unknown) {
      mocks.solanaClientCtor(config)
    }

    connection = mocks.connection
    getConnection = async () => mocks.connection
    getFeePayer = mocks.getFeePayer
  }
}))

vi.mock('./ClaimableTokensClient/ClaimableTokensClient', () => ({
  ClaimableTokensClient: class {
    constructor(config: unknown) {
      mocks.claimableTokensCtor(config)
    }

    deriveUserBank = mocks.deriveUserBank
  }
}))

vi.mock('./RewardManagerClient/RewardManagerClient', () => ({
  RewardManagerClient: class {
    lookupTable: unknown
    constructor(config: { rewardManagerLookupTable?: unknown }) {
      mocks.rewardManagerCtor(config)
      this.lookupTable = config.rewardManagerLookupTable
    }

    getRewardManagerState = mocks.getRewardManagerState
  }
}))

vi.mock('./PaymentRouterClient/PaymentRouterClient', () => ({
  PaymentRouterClient: class {
    constructor(config: unknown) {
      mocks.paymentRouterCtor(config)
    }

    createRouteInstruction = mocks.createRouteInstruction
  }
}))

const solanaClient = {} as SolanaClient
const audiusWalletClient = {} as AudiusWalletClient

describe('lazy Solana program clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not construct the client until a method is called', async () => {
    const config = { solanaClient, audiusWalletClient }
    const client = new LazyClaimableTokensClient(config)
    expect(mocks.claimableTokensCtor).not.toHaveBeenCalled()

    const userBank = Keypair.generate().publicKey
    mocks.deriveUserBank.mockResolvedValueOnce(userBank)
    const params = { ethWallet: '0x123', mint: 'USDC' as const }
    await expect(client.deriveUserBank(params)).resolves.toBe(userBank)
    expect(mocks.claimableTokensCtor).toHaveBeenCalledWith(config)
    expect(mocks.deriveUserBank).toHaveBeenCalledWith(params)
  })

  it('constructs once for concurrent first calls', async () => {
    const client = new LazyClaimableTokensClient({
      solanaClient,
      audiusWalletClient
    })
    mocks.deriveUserBank.mockResolvedValue('bank')
    await Promise.all([
      client.deriveUserBank({ mint: 'USDC' }),
      client.deriveUserBank({ mint: 'wAUDIO' }),
      client.deriveUserBank({ mint: 'USDC' })
    ])
    expect(mocks.claimableTokensCtor).toHaveBeenCalledTimes(1)
    expect(mocks.deriveUserBank).toHaveBeenCalledTimes(3)
  })

  it('propagates errors from the real client', async () => {
    const client = new LazyPaymentRouterClient({ solanaClient })
    mocks.createRouteInstruction.mockRejectedValueOnce(new Error('boom'))
    await expect(client.createRouteInstruction({} as never)).rejects.toThrow(
      'boom'
    )
    expect(mocks.paymentRouterCtor).toHaveBeenCalledTimes(1)
  })

  it('propagates constructor errors and retries on the next call', async () => {
    const client = new LazyRewardManagerClient({ solanaClient })
    mocks.rewardManagerCtor.mockImplementationOnce(() => {
      throw new Error('bad config')
    })
    await expect(client.getRewardManagerState()).rejects.toThrow('bad config')

    mocks.getRewardManagerState.mockResolvedValueOnce({ minVotes: 3 })
    await expect(client.getRewardManagerState()).resolves.toEqual({
      minVotes: 3
    })
    expect(mocks.rewardManagerCtor).toHaveBeenCalledTimes(2)
  })

  it('exposes a configured lookupTable synchronously', () => {
    const rewardManagerLookupTable = Keypair.generate().publicKey
    const client = new LazyRewardManagerClient({
      solanaClient,
      rewardManagerLookupTable
    })
    expect(client.lookupTable).toBe(rewardManagerLookupTable)
    expect(mocks.rewardManagerCtor).not.toHaveBeenCalled()
  })

  it('exposes the default lookupTable once loaded', async () => {
    const client = new LazyRewardManagerClient(
      { solanaClient },
      developmentConfig
    )
    expect(() => client.lookupTable).toThrow('not available')
    mocks.getRewardManagerState.mockResolvedValueOnce({ minVotes: 3 })
    await client.getRewardManagerState()
    expect(client.lookupTable.toBase58()).toBe(
      developmentConfig.solana.rewardManagerLookupTableAddress
    )
  })

  it('applies the environment defaults under the config when loading', async () => {
    const client = new LazyClaimableTokensClient(
      { solanaClient, audiusWalletClient },
      developmentConfig
    )
    mocks.deriveUserBank.mockResolvedValueOnce('bank')
    await client.deriveUserBank({ mint: 'USDC' })
    const config = mocks.claimableTokensCtor.mock.calls[0]![0]
    expect(config.solanaClient).toBe(solanaClient)
    expect(config.audiusWalletClient).toBe(audiusWalletClient)
    expect(config.programId.toBase58()).toBe(
      developmentConfig.solana.claimableTokensProgramAddress
    )
    expect(config.mints.USDC.toBase58()).toBe(
      developmentConfig.solana.usdcTokenMint
    )
  })
})

describe('LazySolanaClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not construct the client until used', async () => {
    const client = new LazySolanaClient({
      solanaWalletAdapter: {} as SolanaWalletAdapter
    })
    expect(mocks.solanaClientCtor).not.toHaveBeenCalled()
    mocks.getFeePayer.mockResolvedValueOnce('payer')
    await expect(client.getFeePayer()).resolves.toBe('payer')
    expect(mocks.solanaClientCtor).toHaveBeenCalledTimes(1)
  })

  it('throws a clear error reading connection before load, then works', async () => {
    const client = new LazySolanaClient({
      solanaWalletAdapter: {} as SolanaWalletAdapter
    })
    expect(() => client.connection).toThrow('getConnection()')
    await expect(client.getConnection()).resolves.toBe(mocks.connection)
    expect(client.connection).toBe(mocks.connection)
    expect(mocks.solanaClientCtor).toHaveBeenCalledTimes(1)
  })
})
