import { useCallback, useState, useEffect, MouseEvent } from 'react'

import {
  ID,
  formatCount,
  AccessConditions,
  Nullable,
  gatedContentSelectors,
  gatedContentActions,
  formatLineupTileDuration,
  Genre,
  getDogEarType,
  isContentUSDCPurchaseGated,
  usePremiumContentPurchaseModal,
  ModalSource
} from '@audius/common'
import { IconCrown, IconHidden, IconTrending } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import IconStar from 'assets/img/iconStar.svg'
import IconVolume from 'assets/img/iconVolume.svg'
import { useModalState } from 'common/hooks/useModalState'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { DogEar } from 'components/dog-ear'
import { Link } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { GatedContentLabel } from 'components/track/GatedContentLabel'
import { TrackTileProps } from 'components/track/types'
import { Text } from 'components/typography'
import typeStyles from 'components/typography/typography.module.css'
import UserBadges from 'components/user-badges/UserBadges'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'
import { profilePage } from 'utils/route'

import { LockedStatusBadge, LockedStatusBadgeProps } from '../LockedStatusBadge'
import { messages } from '../trackTileMessages'

import BottomButtons from './BottomButtons'
import styles from './TrackTile.module.css'
import TrackTileArt from './TrackTileArt'

const { setLockedContentId } = gatedContentActions
const { getGatedTrackStatusMap } = gatedContentSelectors

type ExtraProps = {
  permalink: string
  toggleSave: (trackId: ID) => void
  toggleRepost: (trackId: ID) => void
  onShare: (trackId: ID) => void
  makeGoToRepostsPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
  isStreamGated: boolean
  streamConditions?: Nullable<AccessConditions>
  hasPreview?: boolean
  hasStreamAccess: boolean
}

type CombinedProps = TrackTileProps & ExtraProps

const renderLockedOrPlaysContent = ({
  hasStreamAccess,
  fieldVisibility,
  isOwner,
  isStreamGated,
  listenCount,
  variant
}: Pick<
  CombinedProps,
  | 'hasStreamAccess'
  | 'fieldVisibility'
  | 'isOwner'
  | 'isStreamGated'
  | 'listenCount'
> &
  Pick<LockedStatusBadgeProps, 'variant'>) => {
  if (isStreamGated && !isOwner) {
    return <LockedStatusBadge locked={!hasStreamAccess} variant={variant} />
  }

  const hidePlays = fieldVisibility
    ? fieldVisibility.play_count === false
    : false

  return (
    listenCount !== undefined &&
    listenCount > 0 && (
      <div
        className={cn(styles.plays, {
          [styles.isHidden]: hidePlays
        })}
      >
        {formatCount(listenCount)}
        {messages.getPlays(listenCount)}
      </div>
    )
  )
}

const formatCoSign = ({
  hasReposted,
  hasFavorited
}: {
  hasReposted: boolean
  hasFavorited: boolean
}) => {
  if (hasReposted && hasFavorited) {
    return messages.repostedAndFavorited
  } else if (hasFavorited) {
    return messages.favorited
  }
  return messages.reposted
}

export const RankIcon = ({
  showCrown,
  index,
  className,
  isVisible = true
}: {
  showCrown: boolean
  index: number
  isVisible?: boolean
  className?: string
}) => {
  return isVisible ? (
    <div
      className={cn(
        typeStyles.body,
        typeStyles.bodyXSmall,
        styles.rankContainer,
        className
      )}
    >
      {showCrown ? <IconCrown /> : <IconTrending />}
      {index + 1}
    </div>
  ) : null
}

const TrackTile = (props: CombinedProps) => {
  const {
    id,
    uid,
    index,
    showSkeleton,
    hasLoaded,
    toggleSave,
    toggleRepost,
    onShare,
    onClickOverflow,
    togglePlay,
    coSign,
    darkMode,
    fieldVisibility,
    isActive,
    isMatrix,
    userId,
    isArtistPick,
    isOwner,
    isUnlisted,
    isLoading,
    isStreamGated,
    listenCount,
    streamConditions,
    hasStreamAccess,
    isTrending,
    showRankIcon,
    permalink,
    artistHandle,
    duration,
    genre,
    isPlaying,
    isBuffering,
    variant,
    containerClassName,
    hasPreview = false
  } = props

  const hideShare: boolean = props.fieldVisibility
    ? props.fieldVisibility.share === false
    : false

  const dispatch = useDispatch()
  const [, setModalVisibility] = useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const gatedTrackStatusMap = useSelector(getGatedTrackStatusMap)
  const trackId = isStreamGated ? id : null
  const gatedTrackStatus = trackId ? gatedTrackStatusMap[trackId] : undefined
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const DogEarIconType = isLoading
    ? undefined
    : getDogEarType({
        streamConditions,
        isOwner,
        hasStreamAccess,
        isArtistPick,
        isUnlisted
      })

  const onToggleSave = useCallback(() => toggleSave(id), [toggleSave, id])

  const onToggleRepost = useCallback(() => toggleRepost(id), [toggleRepost, id])

  const onClickShare = useCallback(() => onShare(id), [onShare, id])

  const onClickOverflowMenu = useCallback(
    () => onClickOverflow && onClickOverflow(id),
    [onClickOverflow, id]
  )

  const openLockedContentModal = useCallback(() => {
    if (trackId) {
      dispatch(setLockedContentId({ id: trackId }))
      setModalVisibility(true)
    }
  }, [trackId, dispatch, setModalVisibility])

  const onClickPill = useAuthenticatedClickCallback(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        { contentId: trackId },
        { source: ModalSource.TrackTile }
      )
    } else if (trackId && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    trackId,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    openLockedContentModal
  ])

  const [artworkLoaded, setArtworkLoaded] = useState(false)
  useEffect(() => {
    if (artworkLoaded && !showSkeleton) {
      hasLoaded(index)
    }
  }, [artworkLoaded, hasLoaded, index, showSkeleton])

  const fadeIn = {
    [styles.show]: artworkLoaded && !showSkeleton,
    [styles.hide]: !artworkLoaded || showSkeleton
  }

  const handleClick = useCallback(() => {
    if (showSkeleton) return

    if (trackId && !hasStreamAccess && !hasPreview) {
      openLockedContentModal()
      return
    }

    togglePlay(uid, id)
  }, [
    showSkeleton,
    togglePlay,
    uid,
    id,
    trackId,
    hasStreamAccess,
    hasPreview,
    openLockedContentModal
  ])

  const isReadonly = variant === 'readonly'

  let specialContentLabel = null

  if (!isLoading) {
    if (isStreamGated) {
      specialContentLabel = (
        <GatedContentLabel
          streamConditions={streamConditions}
          hasStreamAccess={!!hasStreamAccess}
          isOwner={isOwner}
        />
      )
    } else if (isArtistPick) {
      specialContentLabel = (
        <div className={styles.artistPickLabelContainer}>
          <IconStar className={styles.artistPickIcon} />
          {messages.artistPick}
        </div>
      )
    }
  }

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
    >
      {DogEarIconType ? (
        <div className={styles.borderOffset}>
          <DogEar type={DogEarIconType} />
        </div>
      ) : null}
      <div className={styles.mainContent} onClick={handleClick}>
        <div
          className={cn(
            typeStyles.body,
            typeStyles.bodyXSmall,
            styles.topRight,
            styles.statText
          )}
        >
          {props.isUnlisted ? (
            <div className={styles.topRightIcon}>
              <IconHidden />
              {messages.hiddenTrack}
            </div>
          ) : null}
          <div className={cn(styles.duration, fadeIn)}>
            {duration
              ? formatLineupTileDuration(
                  duration,
                  genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
                )
              : null}
          </div>
        </div>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            callback={() => setArtworkLoaded(true)}
            showSkeleton={showSkeleton}
            coverArtSizes={props.coverArtSizes}
            coSign={coSign}
            className={styles.albumArtContainer}
            label={`${props.title} by ${props.artistName}`}
            artworkIconClassName={styles.artworkIcon}
          />
          <div
            className={cn(styles.titles, {
              [styles.titlesActive]: isActive,
              [styles.titlesSkeleton]: props.showSkeleton
            })}
          >
            <Link
              variant='title'
              color={isActive ? 'primary' : 'neutral'}
              className={cn(fadeIn, styles.title)}
              to={permalink}
            >
              <Text variant='inherit' className={styles.text}>
                {props.title}
              </Text>
              {isPlaying ? <IconVolume className={styles.playIcon} /> : null}
            </Link>
            {(!artworkLoaded || showSkeleton) && (
              <Skeleton className={styles.skeleton} width='80%' height='80%' />
            )}
            <Link
              to={profilePage(artistHandle)}
              className={cn(fadeIn, styles.artist)}
              color={isActive ? 'primary' : 'neutral'}
            >
              <ArtistPopover handle={artistHandle}>
                <Text variant='inherit' className={styles.text}>
                  {props.artistName}
                </Text>
              </ArtistPopover>
              <UserBadges
                userId={userId}
                badgeSize={12}
                className={styles.iconVerified}
              />
            </Link>
            {(!artworkLoaded || showSkeleton) && (
              <Skeleton className={styles.skeleton} width='60%' height='80%' />
            )}
          </div>
          {coSign && (
            <div
              className={cn(
                typeStyles.labelSmall,
                typeStyles.labelStrong,
                styles.coSignLabel
              )}
            >
              {messages.coSign}
            </div>
          )}
        </div>
        {coSign ? (
          <div
            className={cn(
              typeStyles.body,
              typeStyles.bodyXSmall,
              styles.coSignText
            )}
          >
            <div className={styles.name}>
              {coSign.user.name}
              <UserBadges userId={coSign.user.user_id} badgeSize={8} />
            </div>
            {formatCoSign({
              hasReposted: coSign.has_remix_author_reposted,
              hasFavorited: coSign.has_remix_author_saved
            })}
          </div>
        ) : null}
        <div
          className={cn(
            typeStyles.body,
            typeStyles.bodyXSmall,
            styles.statsRow
          )}
        >
          <div className={styles.stats}>
            <RankIcon
              showCrown={showRankIcon}
              index={index}
              isVisible={isTrending && artworkLoaded && !showSkeleton}
              className={styles.rankIconContainer}
            />
            {specialContentLabel}
            {!(props.repostCount || props.saveCount) ? null : (
              <>
                <div
                  className={cn(styles.statItem, fadeIn, {
                    [styles.disabledStatItem]: !props.repostCount,
                    [styles.isHidden]: props.isUnlisted
                  })}
                  onClick={
                    props.repostCount && !isReadonly
                      ? props.makeGoToRepostsPage(id)
                      : undefined
                  }
                >
                  <RepostButton
                    iconMode
                    isMatrixMode={isMatrix}
                    isDarkMode={darkMode}
                    className={styles.repostButton}
                    wrapperClassName={styles.repostButtonWrapper}
                  />
                  {formatCount(props.repostCount)}
                </div>
                <div
                  className={cn(styles.statItem, fadeIn, {
                    [styles.disabledStatItem]: !props.saveCount,
                    [styles.isHidden]: props.isUnlisted
                  })}
                  onClick={
                    props.saveCount && !isReadonly
                      ? props.makeGoToFavoritesPage(id)
                      : undefined
                  }
                >
                  <FavoriteButton
                    iconMode
                    isDarkMode={darkMode}
                    isMatrixMode={isMatrix}
                    className={styles.favoriteButton}
                    wrapperClassName={styles.favoriteButtonWrapper}
                  />
                  {formatCount(props.saveCount)}
                </div>
              </>
            )}
          </div>
          <div
            className={cn(
              typeStyles.body,
              typeStyles.bodyXSmall,
              styles.bottomRight,
              fadeIn
            )}
          >
            {!isLoading
              ? renderLockedOrPlaysContent({
                  hasStreamAccess,
                  fieldVisibility,
                  isOwner,
                  isStreamGated,
                  listenCount,
                  variant: isPurchase ? 'premium' : 'gated'
                })
              : null}
          </div>
        </div>
        <BottomButtons
          hasSaved={props.hasCurrentUserSaved}
          hasReposted={props.hasCurrentUserReposted}
          toggleRepost={onToggleRepost}
          toggleSave={onToggleSave}
          onShare={onClickShare}
          onClickOverflow={onClickOverflowMenu}
          onClickPill={onClickPill}
          isOwner={isOwner}
          readonly={isReadonly}
          isLoading={isLoading}
          isUnlisted={isUnlisted}
          hasStreamAccess={hasStreamAccess}
          streamConditions={streamConditions}
          gatedTrackStatus={gatedTrackStatus}
          isShareHidden={hideShare}
          isDarkMode={darkMode}
          isMatrixMode={isMatrix}
          isTrack
        />
      </div>
    </div>
  )
}

export default TrackTile
