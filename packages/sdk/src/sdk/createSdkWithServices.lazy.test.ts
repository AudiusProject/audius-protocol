import { describe, expect, it, vi } from 'vitest'

const loaded = vi.hoisted(() => ({ web3: false }))

vi.mock('@solana/web3.js', async (importOriginal) => {
  loaded.web3 = true
  return await importOriginal()
})

describe('createSdkWithServices', () => {
  it('does not load @solana/web3.js until the Solana client is used', async () => {
    const { createSdkWithServices } = await import('./createSdkWithServices')
    const sdk = createSdkWithServices({
      appName: 'test',
      environment: 'development'
    })
    expect(loaded.web3).toBe(false)

    expect(() => sdk.services.solanaClient.connection).toThrow(
      'getConnection()'
    )
    const connection = await sdk.services.solanaClient.getConnection()
    expect(loaded.web3).toBe(true)
    expect(connection.rpcEndpoint).toBeTruthy()
    expect(sdk.services.solanaClient.connection).toBe(connection)
  })
})
