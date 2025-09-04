import { MAX_HANDLE_LENGTH } from '@audius/common/services'
import { z } from 'zod'

const MAX_COIN_SYMBOL_LENGTH = 10

export const coinSymbolErrorMessages = {
  badCharacterError: 'Please only use letters and numbers',
  symbolTooLong: 'Coin symbol is too long (max 10 characters)',
  missingSymbolError: 'Please enter a coin symbol'
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

export const setupFormSchema = z.object({
  coinName: coinNameSchema.shape.coinName,
  coinSymbol: coinSymbolSchema.shape.coinSymbol,
  coinImage: coinImageSchema.shape.coinImage,
  payAmount: z.string().optional(),
  receiveAmount: z.string().optional()
})
