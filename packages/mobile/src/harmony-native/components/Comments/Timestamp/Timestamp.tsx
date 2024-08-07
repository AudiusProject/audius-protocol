import type { TimestampProps } from '@audius/harmony/src/components/comments/Timestamp/types'
import { getLargestTimeUnitText } from '@audius/harmony/src/components/comments/Timestamp/util'

import { Text } from '../..'

export const Timestamp = ({ time }: TimestampProps) => {
  const text = getLargestTimeUnitText(time)

  return (
    <Text variant='body' size='xs' color='subdued'>
      {text}
    </Text>
  )
}
