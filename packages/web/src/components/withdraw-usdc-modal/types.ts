import { WithdrawMethod } from '@audius/common'

export const AMOUNT = 'amount'
export const ADDRESS = 'address'
export const CONFIRM = 'confirm'
export const METHOD = 'method'

export type WithdrawFormValues = {
  [AMOUNT]: number
  [ADDRESS]: string
  [CONFIRM]: boolean
  [METHOD]: WithdrawMethod
}
