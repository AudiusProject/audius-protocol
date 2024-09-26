import { getLargestTimeUnitText } from '@audius/common/utils'

import { Text } from '@audius/harmony-native'

type TimestampProps = {
  time: Date
}

export const Timestamp = ({ time }: TimestampProps) => {
  const text = getLargestTimeUnitText(time)

  return (
    <Text variant='body' size='xs' color='subdued'>
      {text}
    </Text>
  )
}
