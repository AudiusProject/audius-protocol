import { useCallback } from 'react'

import type {
  ID,
  FavoriteType,
  RepostType,
  PremiumConditions,
  Nullable
} from '@audius/common'
import {
  formatCount,
  repostsUserListActions,
  favoritesUserListActions,
  isPremiumContentUSDCPurchaseGated
} from '@audius/common'
import { View, TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import { LockedStatusBadge } from 'app/components/core'
import { CollectionDownloadStatusIndicator } from 'app/components/offline-downloads/CollectionDownloadStatusIndicator'
import { TrackDownloadStatusIndicator } from 'app/components/offline-downloads/TrackDownloadStatusIndicator'
import Text from 'app/components/text'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { LineupTilePremiumContentTypeTag } from './LineupTilePremiumContentTypeTag'
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

const useStyles = makeStyles(({ spacing, palette }) => ({
  stats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing(2),
    marginHorizontal: spacing(2.5)
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
  doesUserHaveAccess?: boolean
  premiumConditions: Nullable<PremiumConditions>
  isOwner: boolean
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
  doesUserHaveAccess,
  premiumConditions,
  isOwner
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
      {premiumConditions ? (
        <LineupTilePremiumContentTypeTag
          premiumConditions={premiumConditions}
          doesUserHaveAccess={doesUserHaveAccess}
          isOwner={isOwner}
        />
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
      {premiumConditions && !isOwner ? (
        <LockedStatusBadge
          locked={!doesUserHaveAccess}
          variant={
            isPremiumContentUSDCPurchaseGated(premiumConditions)
              ? 'purchase'
              : 'gated'
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
