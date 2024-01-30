import { AUDIO, wAUDIO, USDC, FixedDecimal } from '@audius/fixed-decimal'
import BN from 'bn.js'

import { BNWei, BNUSDC } from '~/models/Wallet'

import {
  parseAudioInputToWei,
  formatWei,
  convertWAudioToWei,
  convertWeiToWAudio,
  ceilingBNUSDCToNearestCent,
  floorBNUSDCToNearestCent,
  formatUSDCWeiToUSDString,
  formatUSDCWeiToCeilingDollarNumber,
  formatUSDCWeiToCeilingCentsNumber,
  formatUSDCWeiToFloorDollarNumber,
  formatUSDCWeiToFloorCentsNumber,
  convertBigIntToAmountObject
} from './wallet'

describe('wallet.ts currency formatting and conversion tests', function () {
  it('can parse audio input to wei', function () {
    const audioInput = '12345'
    const expected = '12345000000000000000000'
    expect(AUDIO(audioInput).value.toString()).toBe(expected)
    expect(parseAudioInputToWei(audioInput)?.toString()).toBe(expected)
  })

  it('can format wei (integer)', function () {
    const wei = new BN('123456789012000000000000000000')
    const expected = '123,456,789,012'
    expect(
      AUDIO(wei).toLocaleString('en-US', { maximumFractionDigits: 4 })
    ).toBe(expected)
    expect(formatWei(wei as BNWei, true, 4)).toBe(expected)
  })

  it('can format wei (float)', function () {
    const wei = new BN('123456789012345678901234567890')
    const expected = '123,456,789,012.3456'
    expect(
      AUDIO(wei).toLocaleString('en-US', { maximumFractionDigits: 4 })
    ).toBe(expected)
    expect(formatWei(wei as BNWei, true, 4)).toBe(expected)
  })

  it('can format wei (float zero)', function () {
    const wei = new BN('123456789012000012345678901234')
    const expected = '123,456,789,012'
    expect(
      AUDIO(wei).toLocaleString('en-US', { maximumFractionDigits: 4 })
    ).toBe(expected)
    expect(formatWei(wei as BNWei, true, 4)).toBe(expected)
  })

  it('can convert bigint to amount object', function () {
    const amount = BigInt(123456789)
    const decimals = 4
    const expected = {
      amount: 123456789,
      amountString: '123456789',
      uiAmount: 12345.6789,
      uiAmountString: '12345.6789'
    }
    const decimal = new FixedDecimal(amount, decimals)
    expect({
      amount: Number(decimal.value),
      amountString: decimal.value.toString(),
      uiAmount: Number(decimal.toString()),
      uiAmountString: decimal.toString()
    }).toMatchObject(expected)
    expect(convertBigIntToAmountObject(amount, decimals)).toMatchObject(
      expected
    )
  })

  it('can convert waudio to wei', function () {
    const waudio = new BN('123456789123456789')
    const expected = '1234567891234567890000000000'
    expect(AUDIO(wAUDIO(waudio)).value.toString()).toBe(expected)
    expect(convertWAudioToWei(waudio).toString()).toBe(expected)
  })

  it('can convert wei to waudio', function () {
    const wei = new BN('123456789012345678901234567890')
    const expected = '12345678901234567890'
    expect(wAUDIO(AUDIO(wei)).value.toString()).toBe(expected)
    expect(convertWeiToWAudio(wei).toString()).toBe(expected)
  })

  it('can ceil usdc to nearest cent', function () {
    const usdc = new BN('1234567890')
    const expected = '1234570000'
    expect(USDC(usdc).ceil(2).value.toString()).toBe(expected)
    expect(ceilingBNUSDCToNearestCent(usdc as BNUSDC).toString()).toBe(expected)
  })

  it('can floor usdc to nearest cent', function () {
    const usdc = new BN('1234567890')
    const expected = '1234560000'
    expect(USDC(usdc).floor(2).value.toString()).toBe(expected)
    expect(floorBNUSDCToNearestCent(usdc as BNUSDC).toString()).toBe(expected)
  })

  it('can format usdc wei to usdc string', function () {
    const usdc = new BN('12345678901234567890')
    const precision = 2
    const expected = '12,345,678,901,234.57'
    expect(
      USDC(usdc).toLocaleString('en-US', {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision,
        roundingMode: 'ceil'
      })
    ).toBe(expected)
    expect(formatUSDCWeiToUSDString(usdc, precision)).toBe(expected)
  })

  it('can format usdc wei to ceiling dollar number', function () {
    const usdc = new BN('1234567890')
    const expected = 1234.57
    expect(Number(USDC(usdc).ceil(2).toString())).toBe(expected)
    expect(formatUSDCWeiToCeilingDollarNumber(usdc as BNUSDC)).toBe(expected)
  })

  it('can format usdc wei to ceiling cents number', function () {
    const usdc = new BN('1234567890')
    const expected = 123457
    expect(Number(USDC(usdc).ceil(2).toString()) * 100).toBe(expected)
    expect(formatUSDCWeiToCeilingCentsNumber(usdc as BNUSDC)).toBe(expected)
  })

  it('can format usdc wei to floor dollar number', function () {
    const usdc = new BN('1234567890')
    const expected = 1234.56
    expect(Number(USDC(usdc).floor(2).toString())).toBe(expected)
    expect(formatUSDCWeiToFloorDollarNumber(usdc as BNUSDC)).toBe(expected)
  })

  it('can format usdc wei to floor cents number', function () {
    const usdc = new BN('1234567890')
    const expected = 123456
    expect(Number(USDC(usdc).floor(2).toString()) * 100).toBe(expected)
    expect(formatUSDCWeiToFloorCentsNumber(usdc as BNUSDC)).toBe(expected)
  })
})
