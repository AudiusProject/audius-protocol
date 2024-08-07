import { Text } from 'components/text'

import { TimestampProps } from './types'
import { getLargestTimeUnitText } from './util'

export const Timestamp = ({ time }: TimestampProps) => {
  const text = getLargestTimeUnitText(time)

  return (
    <Text variant='body' size='xs' color='subdued'>
      {text}
    </Text>
  )
}
