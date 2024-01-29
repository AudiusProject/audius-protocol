import BN from 'bn.js'
import { describe, it, expect } from 'vitest'

import {
  AUDIO,
  AudioWei,
  BNAudio,
  BNUSDC,
  USDC,
  UsdcWei,
  wAUDIO
} from './currencies'

describe('Currency tests', function () {
  it('can convert AUDIO to wAUDIO', function () {
    const audio = '123.123456789012345678'
    expect(wAUDIO(AUDIO(audio)).toString()).toBe('123.12345678')
  })

  it('can convert wAUDIO to AUDIO', function () {
    const audio = '123.123456789012345678'
    expect(AUDIO(wAUDIO(audio)).toString()).toBe('123.123456780000000000')
  })

  it('can convert USDC to USD', function () {
    const usdc = '123.123456'
    expect(USDC(usdc).toFixed(2)).toBe('123.12')
  })

  it('can convert USD to USDC', function () {
    const usd = '123.12'
    expect(USDC(usd).toString()).toBe('123.120000')
  })

  it('typechecks method signatures', function () {
    const onlyUsdcWei = (a: UsdcWei) => {
      return a === BigInt(1000000)
    }
    // Throw for unexpected brand of bigint
    // @ts-expect-error
    onlyUsdcWei(AUDIO(1).value)
    // Don't throw for USDC bigints
    onlyUsdcWei(USDC(1).value)
  })

  it('typechecks constructor bigint', function () {
    // Throw for unexpected brand of bigint
    // @ts-expect-error
    USDC(BigInt(1) as AudioWei)
    // Don't throw for raw bigint
    USDC(BigInt(2))
    // Don't throw for correct bigint brand
    USDC(BigInt(3) as UsdcWei)
  })

  it('typechecks constructor BN', function () {
    // Throw for unexpected brand of BN
    // @ts-expect-error
    USDC(new BN(1) as BNAudio)
    // Don't throw for raw BN
    USDC(new BN(2))
    // Don't throw for correct BN brand
    USDC(new BN(3) as BNUSDC)
  })
})
