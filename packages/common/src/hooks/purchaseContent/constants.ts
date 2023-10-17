import { PayExtraPreset } from './types'

export const CUSTOM_AMOUNT = 'customAmount'
export const AMOUNT_PRESET = 'amountPreset'

export const payExtraAmountPresetValues = {
  [PayExtraPreset.LOW]: 100,
  [PayExtraPreset.MEDIUM]: 200,
  [PayExtraPreset.HIGH]: 500
}

// Pay between $1 and $100 extra
export const minimumPayExtraAmountCents = 100
export const maximumPayExtraAmountCents = 10000

export const COOLDOWN_DAYS = 7
