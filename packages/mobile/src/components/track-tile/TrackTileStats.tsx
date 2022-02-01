import { formatCount } from 'audius-client/src/common/utils/formatUtil'
import { View, Pressable, StyleSheet } from 'react-native'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
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
      flexDirection: 'row',
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
  hidePlays: boolean
  index: number
  isTrending?: boolean
  isUnlisted?: boolean
  listenCount: number
  onPressFavorites: GestureResponderHandler
  onPressReposts: GestureResponderHandler
  repostCount: number
  saveCount: number
  showRankIcon?: boolean
}

export const TrackTileStats = ({
  hidePlays,
  index,
  isTrending,
  isUnlisted,
  listenCount,
  onPressFavorites,
  onPressReposts,
  repostCount,
  saveCount,
  showRankIcon
}: Props) => {
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { neutralLight4 } = useThemeColors()

  const hasEngagement = Boolean(repostCount || saveCount)

  return (
    <View style={styles.stats}>
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
            disabled={!repostCount}
            onPress={onPressReposts}
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
            disabled={!saveCount}
            onPress={onPressFavorites}
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
        <Text style={[trackTileStyles.statText, styles.listenCount]}>
          {formatListenCount(listenCount)}
        </Text>
      )}
    </View>
  )
}
