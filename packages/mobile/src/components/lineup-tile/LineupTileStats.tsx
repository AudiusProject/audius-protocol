import { useCallback } from 'react'

import type {
  ID,
  FavoriteType,
  RepostType,
  AccessConditions,
  Nullable
} from '@audius/common'
import {
  formatCount,
  repostsUserListActions,
  favoritesUserListActions,
  isContentUSDCPurchaseGated,
  dayjs
} from '@audius/common'
import moment from 'moment'
import { View, TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  IconCalendarMonth,
  IconHeart,
  IconHidden,
  IconRepost,
  IconStar
} from '@audius/harmony-native'
import { LockedStatusBadge, Text } from 'app/components/core'
import { CollectionDownloadStatusIndicator } from 'app/components/offline-downloads/CollectionDownloadStatusIndicator'
import { TrackDownloadStatusIndicator } from 'app/components/offline-downloads/TrackDownloadStatusIndicator'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { LineupTileGatedContentTypeTag } from './LineupTilePremiumContentTypeTag'
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

const messages = {
  artistPick: "Artist's Pick",
  hiddenTrack: 'Hidden Track'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing(2),
    marginHorizontal: spacing(2.5),
    justifyContent: 'space-between'
  },
  stats: {
    flexDirection: 'row',
    gap: spacing(4)
  },
  listenCount: {
    ...flexRowCentered(),
    justifyContent: 'center'
  },
  leftStats: {
    ...flexRowCentered(),
    gap: spacing(4),
    minHeight: spacing(4)
  },
  statItem: {
    gap: spacing(1)
  },
  disabledStatItem: {
    opacity: 0.5
  },
  favoriteStat: {
    height: spacing(3.5),
    width: spacing(3.5)
  },
  repostStat: {
    height: spacing(4),
    width: spacing(4)
  },
  tagContainer: {
    ...flexRowCentered(),
    gap: spacing(1)
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
  hasStreamAccess?: boolean
  streamConditions: Nullable<AccessConditions>
  isOwner: boolean
  isArtistPick?: boolean
  showArtistPick?: boolean
  releaseDate?: string
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
  showRankIcon,
  hasStreamAccess,
  streamConditions,
  isOwner,
  isArtistPick,
  showArtistPick,
  releaseDate
}: Props) => {
  const styles = useStyles()
  const trackTileStyles = useTrackTileStyles()
  const { neutralLight4, accentPurple } = useThemeColors()
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
    <CollectionDownloadStatusIndicator size={spacing(4)} collectionId={id} />
  ) : (
    <TrackDownloadStatusIndicator size={spacing(4)} trackId={id} />
  )

  const isReadonly = variant === 'readonly'
  const isScheduledRelease = isUnlisted && moment(releaseDate).isAfter(moment())
  return (
    <View style={styles.root}>
      <View style={styles.stats}>
        {isTrending ? (
          <LineupTileRankIcon showCrown={showRankIcon} index={index} />
        ) : null}
        {streamConditions ? (
          <LineupTileGatedContentTypeTag
            streamConditions={streamConditions}
            hasStreamAccess={hasStreamAccess}
            isOwner={isOwner}
          />
        ) : null}
        {!streamConditions && showArtistPick && isArtistPick ? (
          <View style={styles.tagContainer}>
            <IconStar
              fill={neutralLight4}
              height={spacing(4)}
              width={spacing(4)}
            />
            <Text fontSize='xs' colorValue={neutralLight4}>
              {messages.artistPick}
            </Text>
          </View>
        ) : null}
        {isUnlisted && !isScheduledRelease ? (
          <View style={styles.tagContainer}>
            <IconHidden
              fill={neutralLight4}
              height={spacing(4)}
              width={spacing(4)}
            />
            <Text fontSize='xs' colorValue={neutralLight4}>
              {messages.hiddenTrack}
            </Text>
          </View>
        ) : null}
        {isUnlisted && isScheduledRelease && releaseDate ? (
          <View style={styles.tagContainer}>
            <IconCalendarMonth
              fill={accentPurple}
              height={spacing(4)}
              width={spacing(4)}
            />
            <Text fontSize='xs' colorValue={accentPurple}>
              Releases
              {' ' +
                moment(releaseDate).local().format('M/D/YY @ h:mm A') +
                ' ' +
                dayjs().format('z')}
            </Text>
          </View>
        ) : null}
        <View style={styles.leftStats}>
          {hasEngagement && !isUnlisted ? (
            <>
              <TouchableOpacity
                style={[
                  trackTileStyles.statItem,
                  styles.statItem,
                  !repostCount ? styles.disabledStatItem : null
                ]}
                disabled={!repostCount || isReadonly}
                onPress={handlePressReposts}
              >
                <IconRepost
                  height={spacing(4)}
                  width={spacing(4)}
                  fill={neutralLight4}
                  style={styles.repostStat}
                />
                <Text style={trackTileStyles.statText}>
                  {formatCount(repostCount)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  trackTileStyles.statItem,
                  styles.statItem,
                  !saveCount ? styles.disabledStatItem : null
                ]}
                disabled={!saveCount || isReadonly}
                onPress={handlePressFavorites}
              >
                <IconHeart
                  style={styles.favoriteStat}
                  height={spacing(3.5)}
                  width={spacing(3.5)}
                  fill={neutralLight4}
                />
                <Text style={trackTileStyles.statText}>
                  {formatCount(saveCount)}
                </Text>
              </TouchableOpacity>
              <View style={trackTileStyles.statItem}>
                {downloadStatusIndicator}
              </View>
            </>
          ) : null}
        </View>
      </View>
      {streamConditions && !isOwner ? (
        <LockedStatusBadge
          locked={!hasStreamAccess}
          variant={
            isContentUSDCPurchaseGated(streamConditions) ? 'purchase' : 'gated'
          }
        />
      ) : !hidePlays ? (
        <Text style={[trackTileStyles.statText, styles.listenCount]}>
          {formatPlayCount(playCount)}
        </Text>
      ) : null}
    </View>
  )
}
