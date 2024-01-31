import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useState
} from 'react'

import {
  decimalIntegerToHumanReadable,
  filterDecimalString,
  padDecimalValue
} from '@audius/common/utils'
import { useField } from 'formik'

import { BoxedTextField } from '../BoxedTextField'
import { DOWNLOAD_PRICE } from '../types'

const messages = {
  price: {
    title: 'Set a Price',
    description:
      'Set the price fans must pay to access your stem files (minimum price of $1.00)',
    label: 'Cost to download',
    placeholder: '1.00'
  },
  dollars: '$',
  usdc: '(USDC)'
}

type TrackAvailabilityFieldsProps = {
  disabled?: boolean
}

export const DownloadPriceField = (props: TrackAvailabilityFieldsProps) => {
  const { disabled } = props
  const [{ value }, , { setValue: setDownloadPrice }] =
    useField<number>(DOWNLOAD_PRICE)
  const [humanizedValue, setHumanizedValue] = useState(
    value ? decimalIntegerToHumanReadable(value) : null
  )

  const handlePriceChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { human, value } = filterDecimalString(e.target.value)
      setHumanizedValue(human)
      setDownloadPrice(value)
    },
    [setDownloadPrice, setHumanizedValue]
  )

  const handlePriceBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (humanizedValue === null && !e.target.value) {
        // Do nothing if there is no value set and the user just loses focus
        return
      }
      setHumanizedValue(padDecimalValue(e.target.value))
    },
    [humanizedValue]
  )

  return (
    <BoxedTextField
      {...messages.price}
      name={DOWNLOAD_PRICE}
      label={messages.price.label}
      value={humanizedValue ?? undefined}
      placeholder={messages.price.placeholder}
      startAdornment={messages.dollars}
      endAdornment={messages.usdc}
      onChange={handlePriceChange}
      onBlur={handlePriceBlur}
      disabled={disabled}
    />
  )
}
