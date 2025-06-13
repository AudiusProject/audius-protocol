import { z } from 'zod'

import { buySellMessages as messages } from '../../../messages'

/**
 * Schema for validating token swap input
 */
export const createSwapFormSchema = (
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER,
  balance: number | undefined = undefined,
  tokenSymbol: string = ''
) =>
  z.object({
    inputAmount: z
      .string()
      .refine(
        (val) => {
          // Allow empty string during typing, but require it for final validation
          if (val === '') return false
          return !isNaN(parseFloat(val))
        },
        {
          message: messages.emptyAmount
        }
      )
      .refine(
        (val) => {
          if (val === '') return false
          return parseFloat(val) >= min
        },
        {
          message: messages.minAmount(min, tokenSymbol)
        }
      )
      .refine(
        (val) => {
          if (val === '') return false
          return parseFloat(val) <= max
        },
        {
          message: messages.maxAmount(max, tokenSymbol)
        }
      )
      .refine(
        (val) => {
          if (val === '') return false
          return !balance || parseFloat(val) <= balance
        },
        {
          message: messages.insufficientBalance(tokenSymbol)
        }
      ),
    outputAmount: z.string().optional()
  })

export type SwapFormValues = {
  inputAmount: string
  outputAmount: string
}
