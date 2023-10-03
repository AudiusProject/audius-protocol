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
  const match = input.match(/^(?<whole>\d*)(?<dot>.)?(?<decimal>\d*)/)
  const { whole, decimal, dot } = match?.groups || {}

  // Conditionally render the decimal part, and only for the number of decimals specified
  const stringAmount = dot
    ? `${whole}.${(decimal ?? '').substring(0, precision)}`
    : whole
  return { human: stringAmount, value: Number(stringAmount) * 10 ** precision }
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
