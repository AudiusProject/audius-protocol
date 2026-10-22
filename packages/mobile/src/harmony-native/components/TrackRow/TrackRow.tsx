import type { ReactNode } from 'react'

import { useTheme } from '@emotion/react'
import { Pressable, View } from 'react-native'

import { Skeleton } from '../Skeleton'
import { Text } from '../Text/Text'

export const TRACK_ROW_HEIGHT = 64
const ARTWORK_SIZE = 48
const RANK_WIDTH = 20

// Skeleton fills its parent absolutely by default; rows lay it out inline.
const skeletonStyle = { position: 'relative' as const, borderRadius: 4 }

export type TrackRowProps = {
  /** 1-based position shown before the artwork. Omit for unranked lists. */
  rank?: number
  /** 48px square artwork, including any playing overlay. */
  artwork?: ReactNode
  title?: string
  /** Artist line under the title. */
  subtitle?: ReactNode
  /** Shown in place of the duration, e.g. a price button on a locked track. */
  status?: ReactNode
  /** Pre-formatted duration, e.g. "2:30". */
  duration?: string
  /** One short line above the title, such as "Artist Pick". */
  context?: ReactNode
  /** This track is the one loaded in the player. */
  isActive?: boolean
  isLoading?: boolean
  isDisabled?: boolean
  onPress?: () => void
  /** Opens the track's actions. Also exposed to screen readers as an action. */
  onLongPress?: () => void
  /** Accessible name for the row's press action. */
  accessibilityLabel?: string
}

export const TrackRow = (props: TrackRowProps) => {
  const {
    rank,
    artwork,
    title,
    subtitle,
    status,
    duration,
    context,
    isActive,
    isLoading,
    isDisabled,
    onPress,
    onLongPress,
    accessibilityLabel
  } = props
  const { color, spacing } = useTheme()

  const rankCell =
    rank === undefined ? null : (
      <View
        style={{
          width: RANK_WIDTH,
          alignItems: 'center',
          // Sits closer to the artwork than the other cells
          marginRight: -spacing.xs
        }}
      >
        <Text
          variant='body'
          size='m'
          strength='strong'
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {rank}
        </Text>
      </View>
    )
  const paddingLeft = rank === undefined ? spacing.l : spacing.m

  if (isLoading) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.m,
          height: TRACK_ROW_HEIGHT,
          paddingLeft,
          paddingRight: spacing.l
        }}
      >
        {rankCell}
        <Skeleton
          noShimmer
          style={{
            ...skeletonStyle,
            width: ARTWORK_SIZE,
            height: ARTWORK_SIZE
          }}
        />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Skeleton
            noShimmer
            style={{ ...skeletonStyle, width: '60%', height: 14 }}
          />
          <Skeleton
            noShimmer
            style={{ ...skeletonStyle, width: '35%', height: 12 }}
          />
        </View>
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={
        onLongPress ? [{ name: 'longpress', label: 'More options' }] : undefined
      }
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'longpress') onLongPress?.()
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
        minHeight: TRACK_ROW_HEIGHT,
        paddingVertical: spacing.s,
        paddingLeft,
        paddingRight: spacing.l,
        backgroundColor: pressed ? color.background.surface1 : undefined,
        opacity: isDisabled ? 0.5 : 1
      })}
    >
      {rankCell}
      <View
        style={{
          width: ARTWORK_SIZE,
          height: ARTWORK_SIZE,
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        {artwork}
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        {context}
        <Text
          variant='body'
          size='l'
          strength='strong'
          color={isActive ? 'accent' : 'default'}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle}
      </View>
      {status ??
        (duration ? (
          <Text variant='body' size='s' color='subdued'>
            {duration}
          </Text>
        ) : null)}
    </Pressable>
  )
}
