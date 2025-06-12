import { z } from 'zod'

import { walletMessages } from '../../../messages'
import { SolanaWalletAddress } from '../../../models'
import { isValidSolAddress } from '../../wallet/utils'

import { WithdrawMethod } from './types'

export const AMOUNT = 'amount' as const
export const ADDRESS = 'address' as const
export const CONFIRM = 'confirm' as const
export const METHOD = 'method' as const

const MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS = 1

export type WithdrawUSDCFormValues = {
  [AMOUNT]: number
  [ADDRESS]: string
  [METHOD]: WithdrawMethod
  [CONFIRM]?: boolean
}

/**
 * Creates a validation schema for withdraw USDC forms that can be shared
 * between web and mobile platforms.
 *
 * @param userBalanceCents - User's current balance in cents
 * @param minWithdrawBalanceCents - Minimum withdrawal amount for Coinflow (from remote config)
 * @returns Zod validation schema
 */
export const createWithdrawUSDCFormSchema = (
  userBalanceCents: number,
  minWithdrawBalanceCents: number
) => {
  const baseAmount = z
    .number()
    .lte(userBalanceCents, walletMessages.errors.insufficientBalanceDetails)

  const coinflowAmount =
    userBalanceCents !== 0
      ? baseAmount.gte(
          minWithdrawBalanceCents,
          walletMessages.errors.minCashTransfer
        )
      : z.number()

  const manualAmount =
    userBalanceCents !== 0
      ? baseAmount.gte(
          MINIMUM_MANUAL_TRANSFER_AMOUNT_CENTS,
          walletMessages.errors.amountTooLow
        )
      : z.number()

  const coinflowSchema: any = {
    [METHOD]: z.literal(WithdrawMethod.COINFLOW),
    [AMOUNT]: coinflowAmount
  }

  const manualTransferSchema: any = {
    [METHOD]: z.literal(WithdrawMethod.MANUAL_TRANSFER),
    [AMOUNT]: manualAmount,
    [ADDRESS]: z
      .string()
      .min(1, walletMessages.destinationRequired)
      .refine(
        (value) => isValidSolAddress(value as SolanaWalletAddress),
        walletMessages.errors.invalidAddress
      )
  }

  manualTransferSchema[CONFIRM] = z.literal(true, {
    errorMap: () => ({ message: walletMessages.errors.pleaseConfirm })
  })

  return z.discriminatedUnion(METHOD, [
    z.object(coinflowSchema),
    z.object(manualTransferSchema)
  ])
}
