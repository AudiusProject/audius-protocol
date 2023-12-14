import {
  useState,
  useEffect,
  ChangeEventHandler,
  useCallback,
  FocusEventHandler
} from 'react'

import {
  decimalIntegerFromHumanReadable,
  decimalIntegerToHumanReadable,
  filterDecimalString,
  padDecimalValue
} from '@audius/common'

import { TextField, TextFieldProps } from './TextField'

// Maximum field length to safeguard against numeric overflow:
// -1 (for len max int)
// -2 (to account for digits added to include cents)
const MAX_LENGTH = Number.MAX_SAFE_INTEGER.toString().length - 3

const messages = {
  dollars: '$'
}

type PriceFieldProps = TextFieldProps & {
  value: number
  setPrice: (value: number, shouldValidate?: boolean) => void
  setTouched?: (touched: boolean, shouldValidate?: boolean) => void
}

export const PriceField = (props: PriceFieldProps) => {
  const { value, setPrice, setTouched } = props
  const [humanizedValue, setHumanizedValue] = useState(
    value ? decimalIntegerToHumanReadable(value) : null
  )

  useEffect(() => {
    if (humanizedValue !== null) {
      const dehumanizedValue = decimalIntegerFromHumanReadable(humanizedValue)
      if (value === undefined || dehumanizedValue !== value) {
        setPrice(dehumanizedValue)
      }
    }
  }, [value, humanizedValue, setPrice])

  const handlePriceChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { human, value } = filterDecimalString(e.target.value)
      setHumanizedValue(human)
      setPrice(value)
      setTouched?.(true, false)
    },
    [setPrice, setHumanizedValue, setTouched]
  )

  const handlePriceBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setHumanizedValue(padDecimalValue(e.target.value))
    },
    []
  )

  return (
    <TextField
      {...props}
      // Safeguard against numeric overflow, -1 (for len max int), -2 (to account for cents)
      maxLength={MAX_LENGTH}
      value={humanizedValue ?? undefined}
      startAdornment={messages.dollars}
      onChange={handlePriceChange}
      onBlur={handlePriceBlur}
    />
  )
}
