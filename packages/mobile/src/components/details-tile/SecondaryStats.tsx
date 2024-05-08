import {
  formatSecondsAsText,
  formatDate,
  removeNullable,
  pluralize
} from '@audius/common/utils'

import { Flex, Text } from '@audius/harmony-native'

const messages = {
  trackCount: 'track',
  playCount: 'play',
  released: 'Released',
  updated: 'Updated'
}

const SecondaryStatRow = (props: { stats: (string | null)[] }) => {
  const { stats } = props
  const nonNullStats = stats.filter(removeNullable)
  return (
    <Flex direction='row' gap='xs'>
      {nonNullStats.map((stat, i) => {
        return (
          <Text variant='body' size='s' strength='strong' key={i}>
            {stat}
            {i < nonNullStats.length - 1 ? ', ' : ''}
          </Text>
        )
      })}
    </Flex>
  )
}

type SecondaryStatsProps = {
  playCount?: number
  duration?: number
  trackCount?: number
  releaseDate?: string
  updatedAt?: string
  hidePlayCount?: boolean
}

/**
 * The details shown at the bottom of the Track Screen and Collection Screen Headers
 */
export const SecondaryStats = ({
  playCount,
  duration,
  trackCount,
  releaseDate,
  updatedAt,
  hidePlayCount
}: SecondaryStatsProps) => {
  return (
    <Flex gap='xs' w='100%'>
      <SecondaryStatRow
        stats={[
          releaseDate
            ? `${messages.released} ${formatDate(releaseDate)}`
            : null,
          updatedAt ? `${messages.updated} ${formatDate(updatedAt)}` : null
        ]}
      />
      <SecondaryStatRow
        stats={[
          trackCount
            ? `${trackCount} ${pluralize(messages.trackCount, trackCount)}`
            : null,
          formatSecondsAsText(duration ?? 0),
          playCount && !hidePlayCount
            ? `${playCount} ${pluralize(messages.playCount, playCount)}`
            : null
        ]}
      />
    </Flex>
  )
}
