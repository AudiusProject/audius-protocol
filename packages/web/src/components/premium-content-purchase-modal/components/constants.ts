import { PayExtraAmountPresetValues } from './types'

export const CUSTOM_AMOUNT = 'customAmount'
export const AMOUNT_PRESET = 'amountPreset'

export const payExtraAmountPresetValues: PayExtraAmountPresetValues = [
  100, 200, 500
]

// Pay between $1 and $100 extra
export const minimumPayExtraAmountCents = 100
export const maximumPayExtraAmountCents = 10000
