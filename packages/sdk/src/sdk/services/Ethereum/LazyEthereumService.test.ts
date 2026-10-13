import type { PublicClient, WalletClient } from 'viem'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { AudiusWalletClient } from '../AudiusWalletClient'

import { LazyEthereumService } from './LazyEthereumService'

const mocks = vi.hoisted(() => ({
  ctor: vi.fn(),
  balanceOf: vi.fn(),
  unwatch: vi.fn(),
  watchTransfer: vi.fn(),
  permitAudioToken: vi.fn()
}))

vi.mock('./ethereum', () => ({
  EthereumService: class {
    audiusToken = {
      address: '0xloaded',
      abi: ['abi'],
      read: { balanceOf: mocks.balanceOf },
      watchEvent: { Transfer: mocks.watchTransfer }
    }

    constructor(config: unknown) {
      mocks.ctor(config)
    }

    permitAudioToken = mocks.permitAudioToken
  }
}))

const createService = () =>
  new LazyEthereumService({
    publicClient: {} as PublicClient,
    walletClient: {} as WalletClient,
    audiusWalletClient: {} as AudiusWalletClient,
    addresses: { audiusToken: '0xconfigured' }
  })

describe('LazyEthereumService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.watchTransfer.mockReturnValue(mocks.unwatch)
  })

  it('exposes the address without loading', () => {
    const service = createService()
    expect(service.audiusToken.address).toBe('0xconfigured')
    expect(service.staking.address).toMatch(/^0x/)
    expect(() => service.audiusToken.abi).toThrow(/not loaded/)
    expect(mocks.ctor).not.toHaveBeenCalled()
  })

  it('loads once and delegates contract reads', async () => {
    const service = createService()
    mocks.balanceOf.mockResolvedValue(5n)
    const owner = '0x0000000000000000000000000000000000000001'
    const [a, b] = await Promise.all([
      service.audiusToken.read.balanceOf([owner]),
      service.audiusToken.read.balanceOf([owner])
    ])
    expect(a).toBe(5n)
    expect(b).toBe(5n)
    expect(mocks.ctor).toHaveBeenCalledTimes(1)
    expect(mocks.balanceOf).toHaveBeenCalledWith([owner])
    expect(service.audiusToken.abi).toEqual(['abi'])
    expect(service.audiusToken.address).toBe('0xloaded')
  })

  it('is not mistaken for a thenable', async () => {
    const service = createService()
    const read = await service.audiusToken.read
    expect(read).toBe(service.audiusToken.read)
    expect(mocks.ctor).not.toHaveBeenCalled()
  })

  it('delegates helpers and propagates errors', async () => {
    const service = createService()
    mocks.permitAudioToken.mockRejectedValueOnce(new Error('no wallet'))
    await expect(
      service.permitAudioToken({ spender: '0x1', value: 1n })
    ).rejects.toThrow('no wallet')
  })

  it('returns a working unwatch from watchEvent before loading', async () => {
    const service = createService()
    const onLogs = vi.fn()
    const unwatch = service.audiusToken.watchEvent.Transfer({}, { onLogs })
    expect(typeof unwatch).toBe('function')
    await vi.waitFor(() => expect(mocks.watchTransfer).toHaveBeenCalled())
    unwatch()
    expect(mocks.unwatch).toHaveBeenCalledTimes(1)
  })
})
