import { Keypair, PublicKey } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'

import { MintSchema, PublicKeySchema } from './types'

describe('PublicKeySchema', () => {
  it('parses a base58 string into a PublicKey', async () => {
    const key = Keypair.generate().publicKey
    const parsed = await PublicKeySchema.parseAsync(key.toBase58())
    expect(parsed).toBeInstanceOf(PublicKey)
    expect(parsed.equals(key)).toBe(true)
  })

  it('passes a PublicKey through', async () => {
    const key = Keypair.generate().publicKey
    await expect(PublicKeySchema.parseAsync(key)).resolves.toBe(key)
  })

  it('rejects invalid strings with the PublicKey error', async () => {
    const result = await PublicKeySchema.safeParseAsync('not-a-key')
    expect(result.success).toBe(false)
    const tooLong = await PublicKeySchema.safeParseAsync(
      Keypair.generate().publicKey.toBase58() + 'z'
    )
    expect(tooLong.success).toBe(false)
    expect(JSON.stringify(!tooLong.success && tooLong.error.issues)).toContain(
      'Invalid public key input'
    )
  })

  it('rejects non-PublicKey objects', async () => {
    const result = await PublicKeySchema.safeParseAsync({
      toBase58: () => 'x'
    })
    expect(result.success).toBe(false)
  })

  it('works inside MintSchema', async () => {
    await expect(MintSchema.parseAsync('USDC')).resolves.toBe('USDC')
    const key = Keypair.generate().publicKey
    const parsed = await MintSchema.parseAsync(key.toBase58())
    expect(parsed).toBeInstanceOf(PublicKey)
  })
})
