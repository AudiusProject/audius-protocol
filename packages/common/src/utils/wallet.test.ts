import { FixedDecimal } from '@audius/fixed-decimal'
import { describe, it, expect } from 'vitest'

import { convertBigIntToAmountObject } from './wallet'

describe('wallet.ts currency formatting and conversion tests', function () {
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
})
