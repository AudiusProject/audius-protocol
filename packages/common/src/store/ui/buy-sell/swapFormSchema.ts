import { z } from 'zod'

export const messages = {
  inputAmountRequired: 'Amount is required',
  invalidAmount: 'Please enter a valid amount',
  minAmount: (min: number, symbol: string) =>
    `Minimum amount is ${min} ${symbol}`,
  maxAmount: (max: number, symbol: string) =>
    `Maximum amount is ${max} ${symbol}`,
  insufficientBalance: (symbol: string) => `Insufficient ${symbol} balance`
}

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
      .min(1, { message: messages.inputAmountRequired })
      .refine((val) => !isNaN(parseFloat(val)), {
        message: messages.invalidAmount
      })
      .refine((val) => parseFloat(val) >= min, {
        message: messages.minAmount(min, tokenSymbol)
      })
      .refine((val) => parseFloat(val) <= max, {
        message: messages.maxAmount(max, tokenSymbol)
      })
      .refine((val) => !balance || parseFloat(val) <= balance, {
        message: messages.insufficientBalance(tokenSymbol)
      }),
    outputAmount: z.string().optional()
  })

export type SwapFormValues = {
  inputAmount: string
  outputAmount: string
}
