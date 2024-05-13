import { Fragment } from 'react'

import type { Nullable } from '@audius/common/utils'
import {
  formatSecondsAsText,
  formatDate,
  removeNullable,
  pluralize,
  formatCount
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
  if (nonNullStats.length === 0) return null

  return (
    <Text variant='body' size='s' strength='strong'>
      {nonNullStats.map((stat, i) => (
        <Fragment key={stat}>
          {stat}
          {i < nonNullStats.length - 1 ? ', ' : ''}
        </Fragment>
      ))}
    </Text>
  )
}

type SecondaryStatsProps = {
  isCollection?: boolean
  playCount?: number
  duration?: number
  trackCount?: number
  releaseDate?: Nullable<string>
  updatedAt?: string
  hidePlayCount?: boolean
}

/**
 * The details shown at the bottom of the Track Screen and Collection Screen Headers
 */
export const SecondaryStats = (props: SecondaryStatsProps) => {
  const {
    isCollection,
    playCount,
    duration,
    trackCount,
    releaseDate,
    updatedAt,
    hidePlayCount
  } = props

  const releaseDateStat = releaseDate
    ? `${messages.released} ${formatDate(releaseDate)}`
    : null

  const updatedAtStat = updatedAt
    ? `${messages.updated} ${formatDate(updatedAt)}`
    : null

  const trackCountStat = trackCount
    ? `${trackCount} ${pluralize(messages.trackCount, trackCount)}`
    : null

  const durationStat = formatSecondsAsText(duration ?? 0)

  const playCountStat =
    playCount && !hidePlayCount
      ? `${formatCount(playCount)} ${pluralize(messages.playCount, playCount)}`
      : null

  return (
    <Flex gap='xs' w='100%'>
      {isCollection ? (
        <>
          <SecondaryStatRow stats={[releaseDateStat, updatedAtStat]} />
          <SecondaryStatRow
            stats={[trackCountStat, durationStat, playCountStat]}
          />
        </>
      ) : (
        <SecondaryStatRow
          stats={[releaseDateStat, durationStat, playCountStat]}
        />
      )}
    </Flex>
  )
}
