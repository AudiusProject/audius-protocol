import { ChangeEvent, FocusEvent } from 'react'

export const PRECISION = 2

/**
 * Helper to parse change events on a token input and give numeric values and human readable values out
 * @param e HTMLInputElement change event
 */
export const onTokenInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  const input = e.target.value.replace(/[^0-9.]+/g, '')
  // Regex to grab the whole and decimal parts of the number, stripping duplicate '.' characters
  const match = input.match(/^(?<whole>\d*)(?<dot>.)?(?<decimal>\d*)/)
  const { whole, decimal, dot } = match?.groups || {}

  // Conditionally render the decimal part, and only for the number of decimals specified
  const stringAmount = dot
    ? `${whole}.${(decimal ?? '').substring(0, PRECISION)}`
    : whole
  return { human: stringAmount, value: Number(stringAmount) * 100 }
}

/**
 * Helper to parse blur/focus events on a token input and pad the value to precision
 */
export const onTokenInputBlur = (e: FocusEvent<HTMLInputElement>) => {
  const [whole, decimal] = e.target.value.split('.')

  const paddedDecimal = (decimal ?? '')
    .substring(0, PRECISION)
    .padEnd(PRECISION, '0')
  return `${whole.length > 0 ? whole : '0'}.${paddedDecimal}`
}

export const toHumanReadable = (value: number) => {
  return (value / 100).toFixed(PRECISION)
}

export const fromHumanReadable = (value: string) => {
  return parseFloat(value) * 100
}
