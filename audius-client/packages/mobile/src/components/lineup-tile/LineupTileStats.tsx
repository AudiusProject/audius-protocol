import { useCallback } from 'react'

import type { ID, FavoriteType } from '@audius/common'
import { setFavorite } from 'audius-client/src/common/store/user-list/favorites/actions'
import { setRepost } from 'audius-client/src/common/store/user-list/reposts/actions'
import type { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'
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
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

import { LineupTileRankIcon } from './LineupTileRankIcon'
import { createStyles as createTrackTileStyles } from './styles'

const formatPlayCount = (playCount?: number) => {
  if (!playCount) {
    return null
  }
  const suffix = playCount === 1 ? 'Play' : 'Plays'
  return `${formatCount(playCount)} ${suffix}`
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    stats: {
      flexDirection: 'row',
      flex: 0,
      alignItems: 'stretch',
      paddingVertical: 2,
      marginRight: 10,
      height: 26
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
  favoriteType: FavoriteType
  repostType: RepostType
  hidePlays?: boolean
  id: ID
  index: number
  isTrending?: boolean
  isUnlisted?: boolean
  playCount?: number
  repostCount: number
  saveCount: number
  showRankIcon?: boolean
}

export const LineupTileStats = ({
  favoriteType,
  repostType,
  hidePlays,
  id,
  index,
  isTrending,
  isUnlisted,
  playCount,
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
    dispatchWeb(setFavorite(id, favoriteType))
    navigation.push({
      native: { screen: 'Favorited', params: { id, favoriteType } },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, id, navigation, favoriteType])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(id, repostType))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id, repostType }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, id, navigation, repostType])

  return (
    <View style={styles.stats}>
      {isTrending && (
        <LineupTileRankIcon showCrown={showRankIcon} index={index} />
      )}
      {hasEngagement && !isUnlisted && (
        <View style={styles.leftStats}>
          <Pressable
            style={[
              trackTileStyles.statItem,
              !repostCount ? styles.disabledStatItem : {}
            ]}
            disabled={!repostCount}
            onPress={handlePressReposts}>
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
            onPress={handlePressFavorites}>
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
          {formatPlayCount(playCount)}
        </Text>
      )}
    </View>
  )
}
