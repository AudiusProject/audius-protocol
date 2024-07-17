import { useField } from 'formik'

import { Text } from 'app/components/core'

import { BoxedTextField } from './BoxedTextField'

export const TRACK_PRICE = 'stream_conditions.usdc_purchase.price'

const messages = {
  title: 'Set a Price',
  description:
    'Set the price fans must pay to unlock this track (minimum price of $1.00)',
  label: 'Cost to Unlock',
  placeholder: '1.00',
  dollars: '$',
  usdc: '(USDC)'
}

export const TrackPriceField = () => {
  const [{ value }] = useField(TRACK_PRICE)

  return (
    <BoxedTextField
      title={messages.title}
      description={messages.description}
      name={TRACK_PRICE}
      value={value}
      keyboardType='numeric'
      label={messages.label}
      placeholder={messages.placeholder}
      startAdornment={
        <Text color='neutralLight2' weight='bold'>
          {messages.dollars}
        </Text>
      }
      endAdornment={
        <Text color='neutralLight2' weight='bold'>
          {messages.usdc}
        </Text>
      }
    />
  )
}
