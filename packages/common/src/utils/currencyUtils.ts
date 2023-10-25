/**
 * This file contains utilities necessary for working with the variety of
 * currencies within the Audius ecosystem, both for formatting and converting.
 *
 * AUDIO:
 *  The ERC-20 Ethereum-based native token. It has 18 decimals.
 *  Used on the protocol dashboard in the governance and staking systems.
 *
 * wAUDIO:
 *  Also known as "SPL AUDIO" (SPL = Solana Program Library) or "Wrapped AUDIO"
 *  Representation of AUDIO on the Solana blockchain. It has 8 decimals.
 *  Used for working with AUDIO in-app, eg tipping and rewards.
 *
 * SOL:
 *  The native token of the Solana blockchain. Has 9 decimals.
 *  Used as the intermediary in the purchase of wAUDIO and as the "gas" of the
 *  Solana transactions on the platform.
 *
 * USDC:
 *  The SPL USDC stable coin. Has 6 decimals.
 *  Used for purchasing content.
 */

export const AUDIO_DECIMALS = 18
export const WAUDIO_DECIMALS = 8
export const SOL_DECIMALS = 9
export const USDC_DECIMALS = 6
export const CENT_DECIMALS = 4

export type CurrencyAmount = {
  amount: bigint
  decimals: number
}

// TODO: Remove this
const trimRightZeros = (number: string) => {
  return number.replace(/(\d)0+$/gm, '$1')
}

/**
 * Math.floor but for BigInts representing fixed decimals
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns the floor amount
 */
export const floor = ({ amount, decimals }: CurrencyAmount) => {
  const divisor = BigInt(10 ** decimals)
  return (amount / divisor) * divisor
}

/**
 * Math.ceil but for BigInts representing fixed decimals
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns the ceil amount
 */
export const ceil = ({ amount, decimals }: CurrencyAmount) => {
  const divisor = BigInt(10 ** decimals)
  const bump = amount % divisor > 0 ? BigInt(1) : BigInt(0)
  return (amount / divisor + bump) * divisor
}

/**
 * Same as floor() but using significant digits
 * @param amount the amount
 * @param significantDigits the number of digits to keep
 * @returns the truncated amount
 */
export const truncate = (amount: bigint, significantDigits: number) => {
  const decimals = amount.toString().length - significantDigits
  return floor({ amount, decimals })
}

/**
 * Formats a bigint representing a fixed decimal as a fixed decimal string
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns
 */
export const toFixedDecimalString = ({ amount, decimals }: CurrencyAmount) => {
  if (decimals === 0) {
    return amount.toString()
  }
  const str = amount.toString().padStart(decimals + 1, '0')
  return `${str.substring(0, str.length - decimals)}.${str.substring(
    str.length - decimals
  )}`
}

/**
 * Converts a fixed decimal string to a bigint representation
 * @param amount
 * @returns
 */
export const fromFixedDecimalString = (amount: string): CurrencyAmount => {
  const decimalLocation = amount.indexOf('.')
  const amountStripped = amount.replace('.', '')
  const decimals =
    decimalLocation > -1 ? amountStripped.length - decimalLocation : 0
  return {
    amount: BigInt(amountStripped),
    decimals
  }
}

/**
 * Converts a currency amount object to a decimal string without trailing zeros
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns
 */
export const toDecimalString = ({ amount, decimals }: CurrencyAmount) => {
  return trimRightZeros(toFixedDecimalString({ amount, decimals }))
}

/**
 * Converts a decimal string to a currency amount object by padding zeros to the
 * decimal as needed.
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns
 */
export const fromDecimalString = (amount: string, decimals: number) => {
  let [whole, decimal] = amount.split('.')
  decimal = (decimal ?? '').padEnd(decimals, '0')
  return fromFixedDecimalString(`${whole}.${decimal}`)
}

/**
 * Formats the currency to a balance summary string.
 * - Always floor/truncate, never round up
 * - Show two decimal places maximum (eg 1.2345 => 1.23)
 * - Only show decimals if they'll appear non-zero (eg. 1.00234 => 1)
 * - Count by 1000s if over 10k (eg 25,413 => "25K")
 * @param amount the amount
 * @param decimals the number of decimals
 * @returns
 */
export const formatBalanceSummary = ({ amount, decimals }: CurrencyAmount) => {
  if (amount === BigInt(0)) {
    return '0'
  }
  const divisor = BigInt(10 ** decimals)
  const quotient = amount / divisor
  if (quotient >= 10_000) {
    return `${quotient / BigInt(1_000)}K`
  } else if (amount % divisor === BigInt(0)) {
    return quotient.toString()
  } else {
    const amountString = amount.toString()
    const decimalStart = amountString.length - decimals
    // Get the first two decimals (truncated/floored)
    const decimal = amountString.substring(decimalStart, decimalStart + 2)
    if (decimal === '00') {
      return quotient.toString()
    }
    return `${quotient}.${decimal}`
  }
}

type Currency = {
  fromString: (amount: string) => bigint
  toString: (amount: bigint) => string
  
}

export const AUDIO = {
  fromString(amount: string) {
    return fromDecimalString(amount, AUDIO_DECIMALS)
  }
  toString(amount: bigint) {
    return toDecimalString({ amount, decimals: AUDIU})
  }
}