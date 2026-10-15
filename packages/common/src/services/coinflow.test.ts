import bs58 from 'bs58'
import nacl from 'tweetnacl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCoinflowSession } from './coinflow'

const keys = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7))
const args = {
  wallet: bs58.encode(keys.publicKey),
  merchantId: 'tikilabs',
  environment: 'prod' as const,
  signMessage: async (message: Uint8Array) =>
    nacl.sign.detached(message, keys.secretKey)
}
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('createCoinflowSession', () => {
  it('exchanges a base58 wallet signature for a session without an API key', async () => {
    const message = 'Coinflow authentication challenge'
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ message }))
      .mockResolvedValueOnce(response({ key: 'session' }))
    vi.stubGlobal('fetch', fetch)
    const startedAt = Date.now()
    const result = await createCoinflowSession(args)
    expect(result.key).toBe('session')
    expect(result.expiresAt).toBeGreaterThanOrEqual(startedAt + 30 * 60 * 1000)
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.coinflow.cash/api/auth',
      'https://api.coinflow.cash/api/auth/session-key'
    ])
    for (const [, options] of fetch.mock.calls) {
      expect(options.headers).toMatchObject({
        'x-coinflow-auth-wallet': args.wallet,
        'x-coinflow-auth-blockchain': 'solana',
        'x-coinflow-auth-merchant-id': 'tikilabs'
      })
      expect(options.headers).not.toHaveProperty('Authorization')
      expect(options.credentials).toBe('omit')
    }
    const signature =
      fetch.mock.calls[1][1].headers['x-coinflow-auth-signed-message']
    expect(
      nacl.sign.detached.verify(
        new Uint8Array(Buffer.from(message)),
        bs58.decode(signature),
        keys.publicKey
      )
    ).toBe(true)
  })

  it('uses sandbox for both requests when configured', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ message: 'challenge' }))
      .mockResolvedValueOnce(response({ key: 'session' }))
    vi.stubGlobal('fetch', fetch)
    await createCoinflowSession({ ...args, environment: 'sandbox' })
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api-sandbox.coinflow.cash/api/auth',
      'https://api-sandbox.coinflow.cash/api/auth/session-key'
    ])
  })

  it('does not sign or exchange a failed challenge', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ message: 'error' }, 403))
    const signMessage = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(
      createCoinflowSession({ ...args, signMessage })
    ).rejects.toThrow('(403)')
    expect(signMessage).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it.each([{}, { message: '' }, { message: 42 }])(
    'rejects malformed challenge %j',
    async (body) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(body)))
      await expect(createCoinflowSession(args)).rejects.toThrow(
        'message is missing'
      )
    }
  )

  it.each([{}, { key: '' }, { key: 42 }])(
    'rejects malformed session %j',
    async (body) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(response({ message: 'challenge' }))
          .mockResolvedValueOnce(response(body))
      )
      await expect(createCoinflowSession(args)).rejects.toThrow(
        'key is missing'
      )
    }
  )

  it('reports status without leaking an upstream response or signature', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(response({ message: 'challenge' }))
        .mockResolvedValueOnce(
          response({ message: 'sensitive upstream details' }, 401)
        )
    )
    await expect(createCoinflowSession(args)).rejects.toThrow(
      'Coinflow session request failed (401)'
    )
  })

  it.each(['cancel', 'timeout'])(
    'aborts a pending request on %s',
    async (reason) => {
      vi.useFakeTimers()
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url, { signal }: RequestInit) =>
            new Promise((_resolve, reject) => {
              signal!.addEventListener('abort', () =>
                reject(new Error('Aborted'))
              )
            })
        )
      )
      const controller = new AbortController()
      const pending = expect(
        createCoinflowSession({ ...args, signal: controller.signal })
      ).rejects.toThrow('Aborted')
      if (reason === 'cancel') controller.abort()
      else await vi.advanceTimersByTimeAsync(15000)
      await pending
      expect(vi.getTimerCount()).toBe(0)
    }
  )
})
