import {
  useState,
  useEffect,
  ChangeEventHandler,
  useCallback,
  FocusEventHandler
} from 'react'

import { useField } from 'formik'

import {
  toHumanReadable,
  fromHumanReadable,
  onTokenInputChange,
  onTokenInputBlur
} from 'utils/tokenInput'

import { TextField, TextFieldProps } from './TextField'

const messages = {
  dollars: '$'
}

export const PriceField = (props: TextFieldProps) => {
  const [{ value }, , { setValue: setPrice }] = useField<number>(props.name)
  const [humanizedValue, setHumanizedValue] = useState(
    value ? toHumanReadable(value) : null
  )

  useEffect(() => {
    if (humanizedValue !== null) {
      const dehumaizedValue = fromHumanReadable(humanizedValue)
      if (value === undefined || dehumaizedValue !== value) {
        setPrice(dehumaizedValue)
      }
    }
  }, [value, humanizedValue, setPrice])

  const handlePriceChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { human, value } = onTokenInputChange(e)
      setHumanizedValue(human)
      setPrice(value)
    },
    [setPrice, setHumanizedValue]
  )

  const handlePriceBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setHumanizedValue(onTokenInputBlur(e))
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
