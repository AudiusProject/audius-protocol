import { ChangeEventHandler, useCallback, useMemo, useRef } from 'react'

import BN from 'bn.js'
import cn from 'classnames'
import { uniqueId } from 'lodash'

import { useControlled } from 'hooks/useControlled'

import styles from './TokenAmountInput.module.css'
import { TokenAmountInputProps } from './types'

/**
 * Format a number to have commas
 */
const formatNumberCommas = (num: number | string) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] !== undefined ? '.' + parts[1] : '')
  )
}

export const TokenAmountInput = (props: TokenAmountInputProps) => {
  const {
    id,
    label,
    labelClassName,
    className,
    inputClassName,
    tokenLabel,
    tokenLabelClassName,
    decimals = 0,
    isWhole = false,
    inputRef: inputRefProp,
    value: valueProp,
    onChange,
    ...other
  } = props

  const [value, setValueState] = useControlled({
    controlledProp: valueProp ? formatNumberCommas(valueProp) : valueProp,
    defaultValue: '',
    componentName: 'TokenAmountInput'
  })

  const inputRefInternal = useRef<HTMLInputElement>(null)
  const generatedId = useMemo(() => uniqueId(), [])

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const input = e.target.value.replace(/[^0-9.]+/g, '')
      // Regex to grab the whole and decimal parts of the number, stripping duplicate '.' characters
      const match = input.match(/^(?<whole>\d*)(?<dot>.)?(?<decimal>\d*)/)
      const { whole, decimal, dot } = match?.groups || {}

      // Conditionally render the decimal part, and only for the number of decimals specified
      const stringAmount =
        dot && decimals && !isWhole
          ? `${whole}.${decimal.substring(0, decimals)}`
          : whole

      // Also add the BN to the onChange event for convenience
      let amount = new BN(whole)
      amount = amount.mul(new BN(10 ** decimals))
      amount = amount.add(new BN(decimal.padEnd(decimals, '0')))
      setValueState(formatNumberCommas(stringAmount))
      if (onChange) {
        onChange(stringAmount, amount)
      }
    },
    [decimals, isWhole, setValueState, onChange]
  )

  const handleTokenLabelClicked = useCallback(() => {
    if (inputRefProp) {
      inputRefProp.current?.focus()
    } else {
      inputRefInternal.current?.focus()
    }
  }, [inputRefProp, inputRefInternal])

  return (
    <div className={cn(styles.root, className)}>
      {label ? (
        <label
          className={cn(styles.label, labelClassName)}
          htmlFor={id ?? generatedId}
        >
          {label}
        </label>
      ) : null}
      <div className={styles.inputWrapper}>
        <input
          id={id ?? generatedId}
          {...other}
          ref={inputRefProp ?? inputRefInternal}
          className={cn(styles.input, inputClassName)}
          value={value}
          onChange={handleChange}
        />
        <div
          className={cn(styles.tokenLabel, tokenLabelClassName)}
          onClick={handleTokenLabelClicked}
        >
          {tokenLabel}
        </div>
      </div>
    </div>
  )
}
