import { useState, useEffect, useCallback } from 'react'

import {
  filterDecimalString,
  padDecimalValue,
  decimalIntegerToHumanReadable,
  decimalIntegerFromHumanReadable
} from '@audius/common/utils'
import { useField } from 'formik'
import type {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  TextInputFocusEventData
} from 'react-native'

import { Text } from '../core/Text'

import type { TextFieldProps } from './TextField'
import { TextField } from './TextField'

// Maximum field length to safeguard against numeric overflow:
// -1 (for len max int)
// -2 (to account for digits added to include cents)
const MAX_LENGTH = Number.MAX_SAFE_INTEGER.toString().length - 3

const messages = {
  dollars: '$'
}

/** Implements a Formik field for entering a price, including default dollar sign
 * adornment and conversion logic to/from human readable price. Internal value is stored
 * as an integer number of cents.
 */
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

  const handlePriceChange = useCallback(
    (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
      const { human, value } = filterDecimalString(e.nativeEvent.text)
      setHumanizedValue(human)
      setPrice(value)
    },
    [setPrice, setHumanizedValue]
  )

  const handlePriceBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setHumanizedValue(padDecimalValue(e.nativeEvent.text))
    },
    []
  )

  return (
    <TextField
      keyboardType='numeric'
      startAdornment={
        <Text color='neutralLight2' weight='bold'>
          {messages.dollars}
        </Text>
      }
      maxLength={MAX_LENGTH}
      {...props}
      value={humanizedValue ?? undefined}
      onChange={handlePriceChange}
      onEndEditing={handlePriceBlur}
    />
  )
}
