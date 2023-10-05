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
import { useField } from 'formik'

import { TextField, TextFieldProps } from './TextField'

const messages = {
  dollars: '$'
}

export const PriceField = (props: TextFieldProps) => {
  const [{ value }, , { setValue: setPrice }] = useField<number>(props.name)
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
    },
    [setPrice, setHumanizedValue]
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
      value={humanizedValue ?? undefined}
      startAdornment={messages.dollars}
      onChange={handlePriceChange}
      onBlur={handlePriceBlur}
    />
  )
}
