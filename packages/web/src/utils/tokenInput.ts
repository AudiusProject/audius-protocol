import { ChangeEvent, FocusEvent } from 'react'

import { filterDecimalString, padDecimalValue } from '@audius/common'

export const PRECISION = 2

// TODO: Remove this file and use common/src/utils/decimal.ts instead

/**
 * Helper to parse change events on a token input and give numeric values and human readable values out
 * @param e HTMLInputElement change event
 */
export const onTokenInputChange = (e: ChangeEvent<HTMLInputElement>) => {
  return filterDecimalString(e.target.value)
}

/**
 * Helper to parse blur/focus events on a token input and pad the value to precision
 */
export const onTokenInputBlur = (e: FocusEvent<HTMLInputElement>) => {
  return padDecimalValue(e.target.value)
}

export const toHumanReadable = (value: number) => {
  return (value / 100).toFixed(PRECISION)
}

export const fromHumanReadable = (value: string) => {
  return parseFloat(value) * 100
}
