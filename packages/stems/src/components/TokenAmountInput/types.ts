import React, { ComponentPropsWithoutRef, ReactNode } from 'react'

import BN from 'bn.js'

export type TokenAmountInputChangeHandler = (value: string, valueBN: BN) => void

type TokenAmountInputBaseProps = {
  label?: ReactNode
  labelClassName?: string
  className?: string
  inputClassName?: string
  inputRef?: React.RefObject<HTMLInputElement>
  tokenLabel?: string
  tokenLabelClassName?: string
  placeholder?: string
  decimals?: number
  isWhole?: boolean
  value?: string
  onChange?: TokenAmountInputChangeHandler
} & Omit<ComponentPropsWithoutRef<'input'>, 'onChange'>

type TokenAmountInputPropsWithLabel = TokenAmountInputBaseProps & {
  label: string
}
type TokenAmountInputPropsWithAriaLabel = TokenAmountInputBaseProps & {
  ['aria-label']: string
}

export type TokenAmountInputProps =
  | TokenAmountInputPropsWithLabel
  | TokenAmountInputPropsWithAriaLabel
