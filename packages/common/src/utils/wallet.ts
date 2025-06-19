// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FixedDecimal } from '@audius/fixed-decimal'
import BN from 'bn.js'

import { BNWei } from '~/models/Wallet'
import { AmountObject } from '~/store/ui'

/** @deprecated Don't use BN in new code if possible. Use BigInt. */
export const zeroBNWei = new BN(0) as BNWei

// NEW FIXED-DECIMAL UTILITY FUNCTIONS

export const convertBigIntToAmountObject = (
  amount: bigint,
  decimals: number
): AmountObject => {
  const divisor = BigInt(10 ** decimals)
  const quotient = amount / divisor
  const remainder = amount % divisor
  const uiAmountString =
    remainder > 0
      ? `${quotient.toString()}.${remainder.toString().padStart(decimals, '0')}`
      : quotient.toString()
  return {
    amount: Number(amount),
    amountString: amount.toString(),
    uiAmount: Number(amount) / 10 ** decimals,
    uiAmountString
  }
}

/** General Wallet Utils */
export const shortenSPLAddress = (addr: string, numChars = 4) => {
  return `${addr.substring(0, numChars)}...${addr.substr(
    addr.length - numChars - 1
  )}`
}

export const shortenEthAddress = (addr: string, numChars = 4) => {
  return `0x${addr.substring(2, numChars)}...${addr.substr(
    addr.length - numChars - 1
  )}`
}
