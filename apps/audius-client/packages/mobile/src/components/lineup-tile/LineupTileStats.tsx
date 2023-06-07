import { useCallback } from 'react'

import type { ID, FavoriteType, RepostType } from '@audius/common'
import {
  formatCount,
  repostsUserListActions,
  favoritesUserListActions
} from '@audius/common'
import { View, TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import { CollectionDownloadStatusIndicator } from 'app/components/offline-downloads/CollectionDownloadStatusIndicator'
import { TrackDownloadStatusIndicator } from 'app/components/offline-downloads/TrackDownloadStatusIndicator'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { LineupTileRankIcon } from './LineupTileRankIcon'
import { useStyles as useTrackTileStyles } from './styles'
import type { LineupItemVariant } from './types'
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions

const formatPlayCount = (playCount?: number) => {
  if (!playCount) {
    return null
  }
  const suffix = playCount === 1 ? 'Play' : 'Plays'
  return `${formatCount(playCount)} ${suffix}`
}

const useStyles = makeStyles(() => ({
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
}))

type Props = {
  favoriteType: FavoriteType
  repostType: RepostType
  hidePlays?: boolean
  id: ID
  index: number
  isCollection?: boolean
  isTrending?: boolean
  variant?: LineupItemVariant
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
  isCollection,
  isTrending,
  variant,
  isUnlisted,
  playCount,
  repostCount,
  saveCount,
  showRankIcon
}: Props) => {
  const styles = useStyles()
  const trackTileStyles = useTrackTileStyles()
  const { neutralLight4 } = useThemeColors()
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const hasEngagement = Boolean(repostCount || saveCount)

  const handlePressFavorites = useCallback(() => {
    dispatch(setFavorite(id, favoriteType))
    navigation.push('Favorited', { id, favoriteType })
  }, [dispatch, id, navigation, favoriteType])

  const handlePressReposts = useCallback(() => {
    dispatch(setRepost(id, repostType))
    navigation.push('Reposts', { id, repostType })
  }, [dispatch, id, navigation, repostType])

  const downloadStatusIndicator = isCollection ? (
    <CollectionDownloadStatusIndicator size={18} collectionId={id} />
  ) : (
    <TrackDownloadStatusIndicator size={18} trackId={id} />
  )

  const isReadonly = variant === 'readonly'

  return (
    <View style={styles.stats}>
      {isTrending ? (
        <LineupTileRankIcon showCrown={showRankIcon} index={index} />
      ) : null}
      {hasEngagement && !isUnlisted && (
        <View style={styles.leftStats}>
          <TouchableOpacity
            style={[
              trackTileStyles.statItem,
              !repostCount ? styles.disabledStatItem : null
            ]}
            disabled={!repostCount || isReadonly}
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
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              trackTileStyles.statItem,
              !saveCount ? styles.disabledStatItem : null
            ]}
            disabled={!saveCount || isReadonly}
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
          </TouchableOpacity>
          <View style={[trackTileStyles.statItem]}>
            {downloadStatusIndicator}
          </View>
        </View>
      )}
      {!hidePlays ? (
        <Text style={[trackTileStyles.statText, styles.listenCount]}>
          {formatPlayCount(playCount)}
        </Text>
      ) : null}
    </View>
  )
}
