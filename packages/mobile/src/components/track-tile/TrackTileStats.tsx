import { useCallback } from 'react'

import { FavoriteType } from 'audius-client/src/common/models/Favorite'
import { ID } from 'audius-client/src/common/models/Identifiers'
import { setFavorite } from 'audius-client/src/common/store/user-list/favorites/actions'
import { setRepost } from 'audius-client/src/common/store/user-list/reposts/actions'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'
import { formatCount } from 'audius-client/src/common/utils/formatUtil'
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from 'audius-client/src/utils/route'
import { View, Pressable, StyleSheet } from 'react-native'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
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
  trackId: ID
  hidePlays: boolean
  index: number
  isTrending?: boolean
  isUnlisted?: boolean
  listenCount: number
  repostCount: number
  saveCount: number
  showRankIcon?: boolean
}

export const TrackTileStats = ({
  trackId,
  hidePlays,
  index,
  isTrending,
  isUnlisted,
  listenCount,
  repostCount,
  saveCount,
  showRankIcon
}: Props) => {
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { neutralLight4 } = useThemeColors()
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()

  const hasEngagement = Boolean(repostCount || saveCount)

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(trackId, FavoriteType.TRACK))
    navigation.push({
      native: { screen: 'FavoritedScreen', params: undefined },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, trackId, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(trackId, RepostType.TRACK))
    navigation.push({
      native: { screen: 'RepostsScreen', params: undefined },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, trackId, navigation])

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
            onPress={handlePressReposts}
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
            onPress={handlePressFavorites}
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
