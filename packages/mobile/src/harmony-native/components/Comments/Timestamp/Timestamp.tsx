import { getLargestTimeUnitText } from '@audius/harmony/src/components/comments/Timestamp'

import { Text } from '../..'

import type { TimestampProps } from './types'

export const Timestamp = ({ time }: TimestampProps) => {
  const text = getLargestTimeUnitText(time)

  return (
    <Text variant='body' size='xs' color='subdued'>
      {text}
    </Text>
  )
}
