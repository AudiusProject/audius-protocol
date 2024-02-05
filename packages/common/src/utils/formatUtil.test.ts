import { AUDIO, FixedDecimal, USDC, wAUDIO } from '@audius/fixed-decimal'
import BN from 'bn.js'

import { BNWei } from '~/models/Wallet'

import {
  formatCurrencyBalance,
  formatAudio,
  formatWeiToAudioString,
  formatPrice,
  convertFloatToWei,
  formatNumberString,
  formatCount,
  formatBytes,
  parseWeiNumber
} from './formatUtil'

describe('formatUtil', function () {
  it('can format count', function () {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(100)).toBe('100')
    expect(formatCount(1001)).toBe('1K')
    expect(formatCount(1200)).toBe('1.2K')
    // expect(formatCount(1239)).toBe('1.23K') fails: rounds up
    expect(formatCount(10023)).toBe('10K')
    expect(formatCount(10423)).toBe('10.4K')
    expect(formatCount(100000)).toBe('100K')
    expect(formatCount(103313)).toBe('103K')
    expect(formatCount(1000000)).toBe('1M')
    expect(formatCount(1234567)).toBe('1.23M')
    // expect(formatCount(1235567)).toBe('1.23M') fails: rounds up
    expect(formatCount(100000000)).toBe('100M')
  })

  it('can format currency balance', function () {
    const testCases = [
      { input: 0, expected: '0' },
      { input: 0.042, expected: '0.04' },
      { input: 410.1545, expected: '410.15' },
      // { input: 123456789.12345, expected: '123456K' } // note: existing method can't handle this size!
      { input: 452, expected: '452' },
      { input: 999999, expected: '999K' },
      { input: 1000, expected: '1000' },
      { input: 10000, expected: '10K' },
      { input: 51701570.34108908, expected: '51701K' }
      // { input 23.4252, expected: '23.42' } // note: existing method incorrectly rounds this instead of truncating!
    ]
    for (const { input, expected } of testCases) {
      expect(AUDIO(input).toShorthand()).toBe(expected)
      expect(formatCurrencyBalance(input)).toBe(expected)
    }
  })

  it('can format bytes', function () {
    expect(formatBytes(1024)).toBe('1.02 KB')
    expect(formatBytes(3072)).toBe('3.07 KB')
    expect(formatBytes(1234000)).toBe('1.23 MB')
    expect(formatBytes(1234567890)).toBe('1.23 GB')
  })

  it('can format audio', function () {
    const balance = '12345678901234567890'
    const expected = '123,456,789,012.346'
    expect(
      wAUDIO(BigInt(balance)).toLocaleString('en-US', {
        roundingMode: 'halfExpand',
        maximumFractionDigits: 3
      })
    ).toBe(expected)
    expect(formatAudio(balance, 3)).toBe(expected)
  })

  it('can format wei to audio string', function () {
    const wei = new BN('123456789012345678901234567890')
    const expected = '123456789012'
    expect(AUDIO(wei).trunc().toFixed()).toBe(expected)
    expect(formatWeiToAudioString(wei as BNWei)).toBe(expected)
  })

  it('can format price', function () {
    const cents = 123456789.99
    const expected = '1,234,567.90'
    expect(
      USDC(cents / 100).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        roundingMode: 'halfExpand'
      })
    ).toBe(expected)
    expect(formatPrice(cents)).toBe(expected)
  })

  it('can convert float to wei', function () {
    const float = '12345.67890'
    const expected = '12345678900000000000000'
    expect(AUDIO(float).value.toString()).toBe(expected)
    expect(convertFloatToWei(float)?.toString()).toBe(expected)
  })

  it('can parse wei number (integer)', function () {
    const weiNumber = '1234567890'
    const expected = '1234567890000000000000000000'
    expect(AUDIO(weiNumber).value.toString()).toBe(expected)
    expect(parseWeiNumber(weiNumber)?.toString()).toBe(expected)
  })

  it('can parse wei number (floating point)', function () {
    const weiNumber = '1234.567890'
    const expected = '1234567890000000000000'
    expect(AUDIO(weiNumber).value.toString()).toBe(expected)
    expect(parseWeiNumber(weiNumber)?.toString()).toBe(expected)
  })

  it('can format number string w/ max decimals', function () {
    const number = '12345.7890'
    const expected = '12,345.789'
    expect(
      new FixedDecimal(number).toLocaleString('en-US', {
        maximumFractionDigits: 3
      })
    ).toBe(expected)
    expect(formatNumberString(number, { maxDecimals: 3 })).toBe(expected)
  })
  it('can format number string w/ min decimals', function () {
    const number = '12345.7890'
    const expected = '12,345.789000'
    expect(
      new FixedDecimal(number).toLocaleString('en-US', {
        minimumFractionDigits: 6
      })
    ).toBe(expected)
    expect(formatNumberString(number, { minDecimals: 6 })).toBe(expected)
  })
  it('can format number string w/o commas', function () {
    const number = '12345.7890'
    const expected = '12345.7890'
    expect(new FixedDecimal(number).toString()).toBe(expected)
    expect(formatNumberString(number, { excludeCommas: true })).toBe(expected)
  })
  it('can format number string w/ all options', function () {
    const number = '12345.7890'
    const expected = '12345.78'
    expect(new FixedDecimal(number).trunc(2).toFixed(2)).toBe(expected)
    expect(
      formatNumberString(number, {
        excludeCommas: true,
        maxDecimals: 2,
        minDecimals: 2
      })
    ).toBe(expected)
  })
})
