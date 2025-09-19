import {
  QueryContextType,
  fetchCoinTickerAvailability
} from '@audius/common/api'
import { MAX_HANDLE_LENGTH } from '@audius/common/services'
import { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

const MAX_COIN_SYMBOL_LENGTH = 10

export const coinSymbolErrorMessages = {
  badCharacterError: 'Please only use letters and numbers',
  symbolTooLong: 'Coin symbol is too long (max 10 characters)',
  missingSymbolError: 'Please enter a coin symbol',
  tickerTakenError: 'Symbol unavailable.',
  unknownError: 'An unknown error occurred.'
}

const coinSymbolSchema = z.object({
  coinSymbol: z
    .string({ required_error: coinSymbolErrorMessages.missingSymbolError })
    .max(MAX_COIN_SYMBOL_LENGTH, coinSymbolErrorMessages.symbolTooLong)
    .regex(/^[A-Za-z0-9]*$/, coinSymbolErrorMessages.badCharacterError)
    .min(1, coinSymbolErrorMessages.missingSymbolError)
})

export const coinNameErrorMessages = {
  nameTooLong: 'Coin name is too long (max 30 characters)',
  missingNameError: 'Please enter a coin name'
}

export const coinImageErrorMessages = {
  missingImageError: 'Please select a coin image'
}

const coinNameSchema = z.object({
  coinName: z
    .string({ required_error: coinNameErrorMessages.missingNameError })
    .max(MAX_HANDLE_LENGTH, coinNameErrorMessages.nameTooLong)
    .min(1, coinNameErrorMessages.missingNameError)
})

const coinImageSchema = z.object({
  coinImage: z
    .union([z.null(), z.instanceof(File), z.instanceof(Blob)])
    .refine((file) => file !== null, coinImageErrorMessages.missingImageError)
})

export const setupFormSchema = ({
  queryContext,
  queryClient
}: {
  queryContext: QueryContextType
  queryClient: QueryClient
}) => {
  return z.object({
    coinName: coinNameSchema.shape.coinName,
    coinSymbol: coinSymbolSchema.shape.coinSymbol.superRefine(
      async (ticker, context) => {
        // Only validate if ticker has at least 2 characters and passes basic format validation
        if (ticker && ticker.length >= 2) {
          try {
            const result = await queryClient.fetchQuery({
              queryKey: ['coinTickerAvailability', ticker],
              queryFn: async () =>
                await fetchCoinTickerAvailability(ticker, queryContext)
            })
            const isAvailable = result.available

            if (!isAvailable) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message: coinSymbolErrorMessages.tickerTakenError,
                fatal: true
              })
              return z.NEVER
            }
          } catch (error: any) {
            // Log the error for debugging
            console.error('Ticker validation error:', error)
            // For other errors, show unknown error
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: coinSymbolErrorMessages.unknownError
            })
            return z.NEVER
          }
        }
        return z.NEVER
      }
    ),
    coinImage: coinImageSchema.shape.coinImage,
    payAmount: z.string().optional(),
    receiveAmount: z.string().optional()
  })
}
