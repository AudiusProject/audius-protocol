import type BN from 'bn.js'

import { TextInputProps } from '../TextInput'

export type TokenAmountInputChangeHandler = (value: string, valueBN: BN) => void

export type TokenAmountInputProps = Omit<
  TextInputProps,
  'onChange' | 'value'
> & {
  tokenLabel?: string
  decimals?: number
  isWhole?: boolean
  value?: string
  onChange?: TokenAmountInputChangeHandler
}
