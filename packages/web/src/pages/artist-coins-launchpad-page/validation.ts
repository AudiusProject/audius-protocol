import { useMemo } from 'react'

import { useConnectedWallets, useWalletAudioBalance } from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { MAX_HANDLE_LENGTH } from '@audius/common/services'
import { AUDIO } from '@audius/fixed-decimal'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useLaunchpadConfig } from 'hooks/useLaunchpadConfig'

import { getLatestConnectedWallet } from './utils'

export const FIELDS = {
  coinName: 'coinName',
  coinSymbol: 'coinSymbol',
  coinImage: 'coinImage',
  payAmount: 'payAmount',
  receiveAmount: 'receiveAmount'
}

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

export const firstBuyMessages = {
  insufficientBalance: 'Insufficient AUDIO balance',
  maxAudioError: (payAmountMax: number) =>
    `The max AUDIO amount is ${payAmountMax.toLocaleString()}`,
  maxTokenError: (receiveAmountMax: number) =>
    `The max available is ${receiveAmountMax.toLocaleString()}`
}

export const setupFormSchema = ({
  walletMax,
  payAmountMax = Infinity,
  receiveAmountMax = Infinity
}: {
  walletMax: number
  payAmountMax?: number
  receiveAmountMax?: number
}) =>
  z.object({
    [FIELDS.coinName]: coinNameSchema.shape.coinName,
    [FIELDS.coinSymbol]: coinSymbolSchema.shape.coinSymbol,
    [FIELDS.coinImage]: coinImageSchema.shape.coinImage,
    [FIELDS.payAmount]: z
      .string()
      .refine(
        (value) => {
          if (value === undefined || value === '') return true
          return parseFloat(value.replace(/,/g, '')) <= walletMax
        },
        {
          message: firstBuyMessages.insufficientBalance
        }
      )
      .refine(
        (value) => {
          if (value === undefined || value === '') return true
          return parseFloat(value.replace(/,/g, '')) <= payAmountMax
        },
        {
          message: firstBuyMessages.maxAudioError(payAmountMax)
        }
      )
      .optional(),
    [FIELDS.receiveAmount]: z
      .string()
      .optional()
      .refine(
        (value) => {
          if (value === undefined || value === '') return true
          return parseFloat(value.replace(/,/g, '')) <= receiveAmountMax
        },
        {
          message: firstBuyMessages.maxTokenError(receiveAmountMax)
        }
      )
  })

export const useLaunchpadFormSchema = () => {
  const { data: connectedWallets } = useConnectedWallets()
  const { data: firstBuyQuoteData } = useLaunchpadConfig()

  const { maxAudioInputAmount, maxTokenOutputAmount } = useMemo(() => {
    if (!firstBuyQuoteData) {
      return {
        maxAudioInputAmount: Infinity,
        maxTokenOutputAmount: Infinity
      }
    }
    return firstBuyQuoteData
  }, [firstBuyQuoteData])

  const connectedWallet = useMemo(
    () => getLatestConnectedWallet(connectedWallets),
    [connectedWallets]
  )
  const { data: audioBalance } = useWalletAudioBalance({
    address: connectedWallet?.address ?? '',
    chain: connectedWallet?.chain ?? Chain.Sol
  })
  const { audioBalanceNumber } = useMemo(() => {
    if (!audioBalance) {
      return { audioBalanceString: '0.00', audioBalanceNumber: 0 }
    }
    return {
      audioBalanceString: AUDIO(audioBalance).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        roundingMode: 'trunc'
      }),
      audioBalanceNumber: Number(AUDIO(audioBalance).toFixed(2))
    }
  }, [audioBalance])

  return useMemo(() => {
    return {
      validationSchema: toFormikValidationSchema(
        setupFormSchema({
          walletMax: audioBalanceNumber,
          payAmountMax: Math.ceil(maxAudioInputAmount),
          receiveAmountMax: Math.floor(maxTokenOutputAmount) // Floor here because the value is something like 250,000,000.0000970
        })
      ),
      maxPayAmount: Math.ceil(maxAudioInputAmount),
      maxReceiveAmount: Math.floor(maxTokenOutputAmount)
    }
  }, [audioBalanceNumber, maxAudioInputAmount, maxTokenOutputAmount])
}
