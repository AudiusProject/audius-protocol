import React from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { formatCount } from 'audius-client/src/common/utils/formatUtil'
import { View, Animated, Pressable, StyleSheet } from 'react-native'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import Text, { AnimatedText } from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRow, flexRowCentered } from 'app/styles'
import { GestureResponderHandler } from 'app/types/gesture'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

import { TrackTileRankIcon } from './TrackTileRankIcon'
import { createStyles as createTrackTileStyles } from './styles'

const formatListenCount = (listenCount?: number) => {
  if (!listenCount) return null
  const suffix = listenCount === 1 ? 'Play' : 'Plays'
  return `${formatCount(listenCount)} ${suffix}`
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    stats: {
      ...flexRow(),
      flex: 0,
      flexBasis: 26,
      alignItems: 'stretch',
      paddingVertical: 2,
      marginRight: 10,
      height: 30
    },
    listenCount: {
      ...flexRowCentered(),
      justifyContent: 'center',
      marginLeft: 'auto'
    },
    leftStats: {
      ...flexRowCentered()
    },
    disabledStatItem: {
      opacity: 0.5
    },
    statIcon: {
      marginLeft: 4
    },
    favoriteStat: {
      height: 14,
      width: 14
    },
    repostStat: {
      height: 16,
      width: 16
    }
  })

type Props = {
  fadeIn: { opacity: Animated.Value }
  hidePlays: boolean
  id: ID
  index: number
  isTrending?: boolean
  isUnlisted?: boolean
  listenCount: number
  makeGoToFavoritesPage: (trackId: ID) => GestureResponderHandler
  makeGoToRepostsPage: (trackId: ID) => GestureResponderHandler
  repostCount: number
  saveCount: number
  showRankIcon: boolean
}

export const TrackTileStats = ({
  fadeIn,
  hidePlays,
  id,
  index,
  isTrending,
  isUnlisted,
  listenCount,
  makeGoToFavoritesPage,
  makeGoToRepostsPage,
  repostCount,
  saveCount,
  showRankIcon
}: Props) => {
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { neutralLight4 } = useThemeColors()

  const hasEngagement = Boolean(repostCount || saveCount)

  return (
    <Animated.View style={[fadeIn, styles.stats]}>
      {isTrending && (
        <TrackTileRankIcon showCrown={showRankIcon} index={index} />
      )}
      {hasEngagement && !isUnlisted && (
        <View style={styles.leftStats}>
          <Pressable
            style={[
              trackTileStyles.statItem,
              !repostCount ? styles.disabledStatItem : {}
            ]}
            onPress={repostCount ? makeGoToRepostsPage(id) : undefined}
          >
            <Text style={trackTileStyles.statText}>
              {formatCount(repostCount)}
            </Text>
            <IconRepost
              height={16}
              width={16}
              fill={neutralLight4}
              style={[styles.statIcon, styles.repostStat]}
            />
          </Pressable>
          <Pressable
            style={[
              trackTileStyles.statItem,
              !saveCount ? styles.disabledStatItem : {}
            ]}
            onPress={e => saveCount && makeGoToFavoritesPage(id)(e)}
          >
            <Text style={trackTileStyles.statText}>
              {formatCount(saveCount)}
            </Text>
            <IconHeart
              style={[styles.statIcon, styles.favoriteStat]}
              height={14}
              width={14}
              fill={neutralLight4}
            />
          </Pressable>
        </View>
      )}
      {!hidePlays && (
        <AnimatedText
          style={[fadeIn, trackTileStyles.statText, styles.listenCount]}
        >
          {formatListenCount(listenCount)}
        </AnimatedText>
      )}
    </Animated.View>
  )
}
