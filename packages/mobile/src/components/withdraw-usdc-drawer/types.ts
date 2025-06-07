import type { WithdrawMethod } from '@audius/common/store'

export const AMOUNT = 'amount' as const
export const ADDRESS = 'address' as const
export const CONFIRM = 'confirm' as const
export const METHOD = 'method' as const
export const DESTINATION = 'destination' as const

export type WithdrawFormValues = {
  [AMOUNT]: number
  [ADDRESS]: string
  [CONFIRM]: boolean
  [METHOD]: WithdrawMethod
  [DESTINATION]: string
}
