import { Text } from 'app/components/core'
import { PriceField } from 'app/components/fields/PriceField'

import { BoxedTextField } from './BoxedTextField'

export const TRACK_PRICE = 'stream_conditions.usdc_purchase.price'

const messages = {
  title: 'Set a Price',
  description: 'The price to unlock this track (min $1)',
  label: 'Cost to Unlock',
  placeholder: '1.00',
  usdc: '(USDC)'
}

export const TrackPriceField = () => {
  return (
    <BoxedTextField
      title={messages.title}
      description={messages.description}
      TextField={PriceField}
      name={TRACK_PRICE}
      label={messages.label}
      placeholder={messages.placeholder}
      endAdornment={
        <Text color='neutralLight2' weight='bold'>
          {messages.usdc}
        </Text>
      }
    />
  )
}
