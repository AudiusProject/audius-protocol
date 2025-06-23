import { TextInputProps } from '../TextInput'

export type TokenAmountInputChangeHandler = (
  value: string,
  valueBigInt: bigint
) => void

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
