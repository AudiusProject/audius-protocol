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
  isPremiumContentUSDCPurchaseGated,
  dayjs
} from '@audius/common'
import moment from 'moment'
import { View, TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconCalendarMonth } from '@audius/harmony-native'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconHidden from 'app/assets/images/iconHidden.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import { LockedStatusBadge, Text } from 'app/components/core'
import { CollectionDownloadStatusIndicator } from 'app/components/offline-downloads/CollectionDownloadStatusIndicator'
import { TrackDownloadStatusIndicator } from 'app/components/offline-downloads/TrackDownloadStatusIndicator'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
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
  doesUserHaveAccess?: boolean
  premiumConditions: Nullable<PremiumConditions>
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
  doesUserHaveAccess,
  premiumConditions,
  isOwner,
  isArtistPick,
  showArtistPick,
  releaseDate
}: Props) => {
  console.log(
    'asdf releaseDate: ',
    releaseDate,
    moment.utc(releaseDate).local().format('M/D/YY @ h:mm A')
  )
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
  const isScheduledRelease =
    isUnlisted && moment.utc(releaseDate).isAfter(moment())
  return (
    <View style={styles.root}>
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
        {!premiumConditions && showArtistPick && isArtistPick ? (
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
                moment.utc(releaseDate).local().format('M/D/YY @ h:mm A') +
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
