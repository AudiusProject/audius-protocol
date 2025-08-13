import { AUDIO } from '@audius/fixed-decimal'
import numeral from 'numeral'

const PRECISION = 2

export type DecimalUtilOptions = {
  /** Number of digits used on the right side of human-readable values. Defaults to 2 */
  precision?: number
}

/**
 * Helper to parse values from text input and give numeric values and human readable values out. Removes characters that are not numbers or decimals.
 */
export const filterDecimalString = (
  value: string,
  { precision = PRECISION }: DecimalUtilOptions = {}
) => {
  const input = value.replace(/[^0-9.]+/g, '')
  // Regex to grab the whole and decimal parts of the number, stripping duplicate '.' characters
  const match = input.match(/^(\d*)(\.)?(\d*)/)
  const [, whole = '', dot = '', decimal = ''] = match || []

  // Conditionally render the decimal part, and only for the number of decimals specified
  const stringAmount = dot
    ? `${whole}.${(decimal ?? '').substring(0, precision)}`
    : whole

  // Strip leading zeros unless it's just "0" or "0."
  const cleanedAmount =
    stringAmount.replace(/^0+(?=\d)/, '') ||
    (stringAmount.includes('.')
      ? '0' + stringAmount.substring(stringAmount.indexOf('.'))
      : stringAmount)

  return { human: cleanedAmount, value: Number(stringAmount) * 10 ** precision }
}

/**
 * Helper to pad a decimal value to a specified precision, useful for blur events on a token input
 */
export const padDecimalValue = (
  value: string,
  { precision = PRECISION }: Pick<DecimalUtilOptions, 'precision'> = {}
) => {
  const [whole, decimal] = value.split('.')

  const paddedDecimal = (decimal ?? '')
    .substring(0, precision)
    .padEnd(precision, '0')
  return `${whole.length > 0 ? whole : '0'}.${paddedDecimal}`
}

/** Converts an integer value representing a decimal number to it's human-readable form. (ex. 100 => 1.00) */
export const decimalIntegerToHumanReadable = (
  value: number,
  { precision = PRECISION }: DecimalUtilOptions = {}
) => {
  return (value / 10 ** precision).toFixed(precision)
}

/** Converts a string representing a decimal number to its equivalent integer representation (ex. 1.00 => 100) */
export const decimalIntegerFromHumanReadable = (
  value: string,
  { precision = PRECISION }: DecimalUtilOptions = {}
) => {
  return parseFloat(value) * 10 ** precision
}

export const getCurrencyDecimalPlaces = (priceUSD: number) => {
  if (priceUSD >= 1) return 2
  if (priceUSD >= 0.01) return 4
  if (priceUSD >= 0.0001) return 6
  return 8
}

/**
 * Returns the number of decimal places to show for AUDIO balance formatting
 * based on the balance magnitude. Smaller balances show more decimals to remain meaningful.
 * Always shows a minimum of 2 decimal places.
 *
 * @param balance - The balance value to determine decimal places for
 * @returns Number of decimal places to show (minimum 2)
 *
 * @example
 * getTokenDecimalPlaces(1234.56)   // 2 → "1,234.56"
 * getTokenDecimalPlaces(92.0253)   // 2 → "92.02"
 * getTokenDecimalPlaces(1.2345)    // 2 → "1.23"
 * getTokenDecimalPlaces(0.1234)    // 3 → "0.123"
 * getTokenDecimalPlaces(0.00123)   // 5 → "0.00123"
 */
export const getTokenDecimalPlaces = (balance: number) => {
  const absBalance = Math.abs(balance)

  if (absBalance >= 1000) {
    return 2 // 1,234.56 (minimum 2 decimals even for large amounts)
  }
  if (absBalance >= 100) {
    return 2 // 123.45
  }
  if (absBalance >= 10) {
    return 2 // 12.34
  }
  if (absBalance >= 1) {
    return 2 // 1.23
  }
  if (absBalance >= 0.1) {
    return 3 // 0.123
  }
  if (absBalance >= 0.01) {
    return 4 // 0.0123
  }
  if (absBalance >= 0.001) {
    return 5 // 0.00123
  }

  // For very small amounts, show enough decimals to see meaningful value
  return 6
}

export const formatAudioBalance = (
  balance: bigint,
  locale: string = 'en-US'
): string => {
  const balanceNumber = Number(AUDIO(balance).toString())
  const decimalPlaces = getTokenDecimalPlaces(balanceNumber)

  return AUDIO(balance).toLocaleString(locale, {
    maximumFractionDigits: decimalPlaces,
    roundingMode: 'trunc'
  })
}

/**
 * Formats a number as currency with dynamic decimal places based on value magnitude.
 * Uses getCurrencyDecimalPlaces to determine appropriate precision.
 *
 * @param num - The number to format as currency
 * @param locale - Locale for number formatting (defaults to 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(123.456)  // "$123.46"
 * formatCurrency(0.0012)   // "$0.001200"
 * formatCurrency(0)        // "$0.00"
 */
export const formatCurrency = (
  num: number,
  locale: string = 'en-US'
): string => {
  if (num === 0) return '$0.00'

  try {
    const decimalPlaces = getCurrencyDecimalPlaces(num)
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Math.min(decimalPlaces, 2),
      maximumFractionDigits: decimalPlaces
    }).format(num)

    return formatted
  } catch {
    return `$${num.toFixed(2)}`
  }
}

export const formatCurrencyWithMax = (
  num: number,
  max: number,
  locale: string = 'en-US'
): string => {
  if (num >= max) {
    const formatted = numeral(num).format('0.00a').toUpperCase()
    return formatted.includes('.00')
      ? `$${numeral(num).format('0a').toUpperCase()}`
      : `$${formatted}`
  }

  return formatCurrency(num, locale)
}
