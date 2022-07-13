import { useState, useCallback } from 'react'
import * as React from 'react'

import cn from 'classnames'

import styles from './TokenValueInput.module.css'
import { TokenValueInputProps, Format } from './types'

const formatValue = (value: string | undefined) => {
  if (!value) return value

  // Capture whole part and decimal parth
  const capture = value.match(/^(?<whole>\d*)(?<dot>.)?(?<decimal>\d*)$/)
  if (!capture || !capture.groups) return value
  const { whole, decimal, dot } = capture.groups

  // Parse out the whole number
  const numericWhole = whole ? parseInt(whole, 10) : 0
  // Format the whole number
  const formattedWhole = numericWhole.toLocaleString('en-US')

  if (dot) {
    return `${formattedWhole}.${decimal}`
  }
  return formattedWhole
}

const inputPaddingRight = 16
export const TokenValueInput: React.FC<TokenValueInputProps> = ({
  className,
  labelClassName,
  inputClassName,
  rightLabelClassName,
  label,
  value,
  type,
  format = Format.INPUT,
  placeholder,
  onChange,
  onBlur,
  isNumeric,
  isWhole,
  rightLabel
}: TokenValueInputProps) => {
  const [inputValue, setInputValue] = useState(value)
  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let value = e.target.value
      if (isNumeric) {
        value = value.replace(/[^0-9.]+/g, '')
      }
      if (isWhole) {
        value = value.replace(/[^0-9]+/g, '')
      }
      setInputValue(value)
      if (onChange) onChange(value)
    },
    [setInputValue, onChange, isNumeric, isWhole]
  )

  let displayValue
  if (isNumeric) {
    displayValue =
      value !== undefined ? formatValue(value) : formatValue(inputValue)
  } else {
    displayValue = value !== undefined ? value : inputValue
  }

  const [inputPadding, setInputPadding] = useState(inputPaddingRight)
  const setLabelRef = useCallback(
    (node) => {
      if (node) {
        // TODO: wait for animation before getting width
        // const width = node.getBoundingClientRect().width
        const width = 78
        setInputPadding(width + inputPaddingRight)
      }
    },
    [setInputPadding]
  )

  return (
    <div className={cn(styles.container, { [className!]: !!className })}>
      {label && (
        <div
          className={cn(styles.label, {
            [labelClassName!]: !!labelClassName
          })}>
          {label}
        </div>
      )}
      {format === Format.INPUT ? (
        <input
          className={cn(styles.input, {
            [inputClassName!]: !!inputClassName
          })}
          style={{ paddingRight: inputPadding }}
          value={displayValue}
          type={type}
          onChange={onInputChange}
          onBlur={onBlur}
          placeholder={placeholder}
        />
      ) : (
        <textarea
          className={cn(styles.input, {
            [inputClassName!]: !!inputClassName
          })}
          style={{ paddingRight: inputPadding }}
          value={displayValue}
          onChange={onInputChange}
          placeholder={placeholder}
        />
      )}
      {rightLabel && (
        <div
          className={cn(styles.rightLabel, {
            [rightLabelClassName as string]: !!rightLabelClassName
          })}
          ref={setLabelRef}>
          {rightLabel}
        </div>
      )}
    </div>
  )
}
