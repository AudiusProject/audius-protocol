/*
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

/**
 * A type that represents a cryptocurrency amount as an object with two parts:
 * - The full Wei amount as a bigint
 * - The number of decimals
 */
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
 * Formats a bigint representing a fixed decimal as a fixed decimal string.
 * Intended for serialization purposes only, not to be used in UI.
 * @see toFixedString for user facing formatting
 * @see formatBalance for user facing balance
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
 * Intended for utility purposes only, not to be used in UI.
 * @see toFixedString for user facing formatting
 * @see formatBalance for user facing balance
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
 * Formats the amount into a decimal and fixes the number of decimal digits
 * @example toFixedString(AUDIO(123.456), 2) === "123.45"
 */
export const toFixedString = (amount: CurrencyAmount, decimals: number) => {
  if (decimals < 0) {
    throw Error('Decimals must be positive')
  }
  const defaultFixed = toFixedDecimalString(amount)
  const parts = defaultFixed.split('.')
  if (decimals > 0 && parts.length > 1 && parts[1] !== undefined) {
    return `${parts[0]}.${parts[1].substring(0, decimals)}`
  } else {
    return parts[0]
  }
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
export const formatBalance = ({ amount, decimals }: CurrencyAmount) => {
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

/**
 * Creates a CurrencyAmount
 * @param amount the amount of currency, represented as:
 * - a decimal string or number (1.234 or "1.234"),
 * - as a CurrencyAmount { amount: 1234n, decimals: 3 }
 * - as the raw BigInt (1234000000000000000n)
 * @returns {CurrencyAmount} the amount of AUDIO as a CurrencyAmount object
 */
const createCurrencyAmountConstructor =
  (decimals: number) =>
  (amount: string | number | CurrencyAmount | bigint): CurrencyAmount => {
    if (typeof amount === 'string' || typeof amount === 'number') {
      return fromDecimalString('' + amount, decimals)
    } else if (typeof amount === 'object') {
      return fromDecimalString(toDecimalString(amount), decimals)
    } else {
      return { amount, decimals }
    }
  }

/**
 * The number of decimal digits in a unit of AUDIO (ERC-20)
 */
const AUDIO_DECIMALS = 18
/**
 * The number of decimal digits in a unit of wrapped AUDIO (SPL)
 */
const WAUDIO_DECIMALS = 8
/**
 * The number of decimal digits in a unit of SOL (SPL)
 */
const SOL_DECIMALS = 9
/**
 * The number of decimal digits in a unit of USDC (SPL)
 */
const USDC_DECIMALS = 6

/**
 * Helper function to construct AUDIO currency amounts
 * @see createCurrencyAmountConstructor
 */
export const AUDIO = createCurrencyAmountConstructor(AUDIO_DECIMALS)
/**
 * Helper function to construct wAUDIO currency amounts
 * @see createCurrencyAmountConstructor
 */
export const wAUDIO = createCurrencyAmountConstructor(WAUDIO_DECIMALS)
/**
 * Helper function to construct SOL currency amounts
 * @see createCurrencyAmountConstructor
 */
export const SOL = createCurrencyAmountConstructor(SOL_DECIMALS)
/**
 * Helper function to construct USDC currency amounts
 * @see createCurrencyAmountConstructor
 */
export const USDC = createCurrencyAmountConstructor(USDC_DECIMALS)
