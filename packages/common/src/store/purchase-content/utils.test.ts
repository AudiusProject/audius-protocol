import BN from 'bn.js'

import { BNUSDC } from '~/models/Wallet'
import { BN_USDC_CENT_WEI } from '~/utils/wallet'

import { getBalanceNeeded, getPurchaseSummaryValues } from './utils'

function centsToBN(cents: number) {
  return new BN(cents).mul(BN_USDC_CENT_WEI) as BNUSDC
}

const minPurchaseAmountCents = 100

describe('store/purchase-content/utils', () => {
  test.each([
    {
      description: 'no balance, no extra amount, full price due',
      price: 100,
      currentBalance: centsToBN(0),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 100, existingBalance: 0 }
    },
    {
      description: 'no balance, extra amount, full price due',
      price: 100,
      currentBalance: centsToBN(0),
      extraAmount: 100,
      minPurchaseAmountCents,
      expected: { amountDue: 200, existingBalance: 0 }
    },
    {
      description: 'price - balance less than minimum, full price due',
      price: 100,
      currentBalance: centsToBN(1),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 100, existingBalance: 0 }
    },
    {
      description: 'price - balance less than minimum, full price due',
      price: 100,
      currentBalance: centsToBN(99),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 100, existingBalance: undefined }
    },
    {
      description:
        'price + extraAmount - balance less than minimum, full price due',
      price: 100,
      currentBalance: centsToBN(101),
      extraAmount: 100,
      minPurchaseAmountCents,
      expected: { amountDue: 200, existingBalance: undefined }
    },
    {
      description: 'no extra amount, balance equals price, nothing due',
      price: 100,
      currentBalance: centsToBN(100),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 0, existingBalance: 100 }
    },
    {
      description: 'no extra amount, balance exceeds price, nothing due',
      price: 100,
      currentBalance: centsToBN(101),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 0, existingBalance: 100 }
    },
    {
      description: 'with extra amount, balance covers price, nothing due',
      price: 100,
      currentBalance: centsToBN(200),
      extraAmount: 100,
      minPurchaseAmountCents,
      expected: { amountDue: 0, existingBalance: 200 }
    },
    {
      description: 'with extra amount, balance exceeds price, nothing due',
      price: 100,
      currentBalance: centsToBN(201),
      extraAmount: 100,
      minPurchaseAmountCents,
      expected: { amountDue: 0, existingBalance: 200 }
    },
    {
      description: 'balance covers part of purchase, remainder due',
      price: 200,
      currentBalance: centsToBN(50),
      extraAmount: 0,
      minPurchaseAmountCents,
      expected: { amountDue: 150, existingBalance: 50 }
    },
    {
      description:
        'with extraAmount, balance covers part of purchase, remainder due',
      price: 100,
      currentBalance: centsToBN(50),
      extraAmount: 100,
      minPurchaseAmountCents,
      expected: { amountDue: 150, existingBalance: 50 }
    }
  ])(
    `getPurchaseSummaryValues: $description`,
    ({
      price,
      currentBalance,
      extraAmount,
      minPurchaseAmountCents,
      expected
    }) => {
      expect(
        getPurchaseSummaryValues({
          price,
          extraAmount,
          currentBalance,
          minPurchaseAmountCents
        })
      ).toEqual(expect.objectContaining(expected))
    }
  )

  test.each([
    {
      description: 'no balance, full price needed',
      amountDue: centsToBN(100),
      balance: centsToBN(0),
      minPurchaseAmountCents,
      expected: 100
    },
    {
      description: 'balance brings price below minimum, full price needed',
      amountDue: centsToBN(100),
      balance: centsToBN(1),
      minPurchaseAmountCents,
      expected: 100
    },
    {
      description: 'balance brings price below minimum, full price needed',
      amountDue: centsToBN(100),
      balance: centsToBN(99),
      minPurchaseAmountCents,
      expected: 100
    },
    {
      description: 'balance equals price, no additional balance needed',
      amountDue: centsToBN(100),
      balance: centsToBN(100),
      minPurchaseAmountCents,
      expected: 0
    },
    {
      description: 'balance exceeds price, no additional balance needed',
      amountDue: centsToBN(100),
      balance: centsToBN(101),
      minPurchaseAmountCents,
      expected: 0
    },
    {
      description: 'balance covers part of purchase price, remainder needed',
      amountDue: centsToBN(150),
      balance: centsToBN(50),
      minPurchaseAmountCents,
      expected: 100
    }
  ])(
    `getBalanceNeeded: $description`,
    ({ amountDue, balance, minPurchaseAmountCents, expected }) => {
      expect(
        getBalanceNeeded(amountDue, balance, minPurchaseAmountCents)
      ).toEqual(centsToBN(expected))
    }
  )
})
