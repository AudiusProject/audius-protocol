import { Keypair } from '@solana/web3.js'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { AudiusWalletClient } from '../../AudiusWalletClient'

import { LazyClaimableTokensClient } from './ClaimableTokensClient/LazyClaimableTokensClient'
import { LazyPaymentRouterClient } from './PaymentRouterClient/LazyPaymentRouterClient'
import { LazyRewardManagerClient } from './RewardManagerClient/LazyRewardManagerClient'
import type { SolanaClient } from './SolanaClient'

const mocks = vi.hoisted(() => ({
  claimableTokensCtor: vi.fn(),
  deriveUserBank: vi.fn(),
  rewardManagerCtor: vi.fn(),
  getRewardManagerState: vi.fn(),
  paymentRouterCtor: vi.fn(),
  createRouteInstruction: vi.fn()
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
    constructor(config: unknown) {
      mocks.rewardManagerCtor(config)
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

  it('exposes lookupTable synchronously', () => {
    const rewardManagerLookupTable = Keypair.generate().publicKey
    const client = new LazyRewardManagerClient({
      solanaClient,
      rewardManagerLookupTable
    })
    expect(client.lookupTable).toBe(rewardManagerLookupTable)
    expect(
      new LazyRewardManagerClient({ solanaClient }).lookupTable
    ).toBeDefined()
    expect(mocks.rewardManagerCtor).not.toHaveBeenCalled()
  })
})
