import { z } from 'zod'

import {
  AMOUNT_PRESET,
  CUSTOM_AMOUNT,
  maximumPayExtraAmountCents,
  minimumPayExtraAmountCents
} from './constants'
import { PayExtraPreset } from './types'

const messages = {
  amountTooLow: 'Amount cannot exceed $100',
  amountTooHigh: 'Amount must be greater than $1'
}

const createPurchaseContentSchema = () => {
  return z.object({
    [CUSTOM_AMOUNT]: z
      .number()
      .lte(maximumPayExtraAmountCents, messages.amountTooHigh)
      .gte(minimumPayExtraAmountCents, messages.amountTooLow),
    [AMOUNT_PRESET]: z.nativeEnum(PayExtraPreset)
  })
}

export const PurchaseContentSchema = createPurchaseContentSchema()
export type PurchaseContentValues = z.input<typeof PurchaseContentSchema>
