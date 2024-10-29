import { useCallback, useEffect, MouseEvent, ReactNode } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  ModalSource,
  isContentUSDCPurchaseGated,
  ID,
  AccessConditions,
  GatedContentStatus
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  usePremiumContentPurchaseModal,
  gatedContentActions,
  gatedContentSelectors,
  PurchaseableContentType
} from '@audius/common/store'
import {
  formatCount,
  Genre,
  formatLineupTileDuration,
  getDogEarType,
  Nullable
} from '@audius/common/utils'
import {
  IconVolumeLevel2 as IconVolume,
  IconCrown,
  IconTrending,
  Text,
  Flex,
  IconStar,
  IconMessage
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import { DogEar } from 'components/dog-ear'
import { TextLink, UserLink } from 'components/link'
import { LockedStatusPill } from 'components/locked-status-pill'
import Skeleton from 'components/skeleton/Skeleton'
import { TrackTileProps } from 'components/track/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'

import { GatedConditionsPill } from '../GatedConditionsPill'
import { GatedTrackLabel } from '../GatedTrackLabel'
import { LineupTileLabel } from '../LineupTileLabel'
import { VisibilityLabel } from '../VisibilityLabel'
import { messages } from '../trackTileMessages'

import BottomButtons from './BottomButtons'
import styles from './TrackTile.module.css'
import TrackTileArt from './TrackTileArt'

const { setLockedContentId } = gatedContentActions
const { getGatedContentStatusMap } = gatedContentSelectors

type ExtraProps = {
  permalink: string
  toggleSave: (trackId: ID) => void
  toggleRepost: (trackId: ID) => void
  onShare: (trackId: ID) => void
  makeGoToRepostsPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToCommentsPage: (trackId: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  darkMode: boolean
  isMatrix: boolean
  isStreamGated: boolean
  streamConditions?: Nullable<AccessConditions>
  hasPreview?: boolean
  hasStreamAccess: boolean
  trackId?: number
  renderOverflow?: () => ReactNode
}

type CombinedProps = TrackTileProps & ExtraProps

type LockedOrPlaysContentProps = Pick<
  CombinedProps,
  | 'trackId'
  | 'hasStreamAccess'
  | 'isOwner'
  | 'isStreamGated'
  | 'streamConditions'
  | 'listenCount'
  | 'variant'
> & {
  lockedContentType: 'gated' | 'premium'
  gatedTrackStatus?: GatedContentStatus
  onClickGatedUnlockPill: (e: MouseEvent) => void
}

const renderLockedContentOrPlayCount = ({
  trackId,
  hasStreamAccess,
  isOwner,
  isStreamGated,
  streamConditions,
  gatedTrackStatus,
  listenCount,
  onClickGatedUnlockPill,
  variant,
  lockedContentType
}: LockedOrPlaysContentProps) => {
  if (isStreamGated && streamConditions && !isOwner) {
    if (
      !hasStreamAccess &&
      lockedContentType === 'premium' &&
      variant === 'readonly' &&
      trackId
    ) {
      return (
        <GatedConditionsPill
          streamConditions={streamConditions}
          unlocking={gatedTrackStatus === 'UNLOCKING'}
          onClick={onClickGatedUnlockPill}
          buttonSize='small'
          contentId={trackId}
          contentType='track'
        />
      )
    }
    return (
      <LockedStatusPill locked={!hasStreamAccess} variant={lockedContentType} />
    )
  }

  return (
    listenCount !== undefined &&
    listenCount > 0 && (
      <div className={styles.plays}>
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
  isVisible = true
}: {
  showCrown: boolean
  index: number
  isVisible?: boolean
  className?: string
}) => {
  return isVisible ? (
    <LineupTileLabel icon={showCrown ? IconCrown : IconTrending} color='accent'>
      {`${index + 1}`}
    </LineupTileLabel>
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
    isActive,
    isMatrix,
    userId,
    isArtistPick,
    isScheduledRelease,
    releaseDate,
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
    duration,
    genre,
    isPlaying,
    isBuffering,
    variant,
    containerClassName,
    hasPreview = false,
    title,
    source,
    renderOverflow
  } = props

  const hideShare: boolean = props.fieldVisibility
    ? props.fieldVisibility.share === false
    : false

  const dispatch = useDispatch()
  const [, setModalVisibility] = useModalState('LockedContent')
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const trackId = isStreamGated ? id : null
  const gatedTrackStatus = trackId ? gatedTrackStatusMap[trackId] : undefined
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const DogEarIconType = isLoading
    ? undefined
    : getDogEarType({
        streamConditions,
        isOwner,
        hasStreamAccess
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
        { contentId: trackId, contentType: PurchaseableContentType.TRACK },
        { source: source ?? ModalSource.TrackTile }
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

  useEffect(() => {
    if (!showSkeleton) {
      hasLoaded(index)
    }
  }, [hasLoaded, index, showSkeleton])

  const fadeIn = {
    [styles.show]: !showSkeleton,
    [styles.hide]: showSkeleton
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

  const { isEnabled: isCommentsEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isReadonly = variant === 'readonly'

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
        <Text
          variant='body'
          size='xs'
          className={cn(styles.topRight, styles.statText)}
        >
          <div className={cn(styles.duration, fadeIn)}>
            {duration
              ? formatLineupTileDuration(
                  duration,
                  genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
                )
              : null}
          </div>
        </Text>
        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack
            isPlaying={isPlaying}
            isBuffering={isBuffering}
            showSkeleton={showSkeleton}
            coverArtSizes={props.coverArtSizes}
            coSign={coSign}
            className={styles.albumArtContainer}
            label={`${title} by ${props.artistName}`}
            artworkIconClassName={styles.artworkIcon}
          />
          <Flex
            direction='column'
            justifyContent='center'
            gap='2xs'
            mr='m'
            flex='0 1 65%'
            css={{ overflow: 'hidden' }}
          >
            <TextLink
              to={permalink}
              textVariant='title'
              isActive={isActive}
              applyHoverStylesToInnerSvg
            >
              <Text ellipses>{title || messages.loading}</Text>
              {isPlaying ? <IconVolume size='m' /> : null}
              {showSkeleton ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </TextLink>
            <UserLink userId={userId} badgeSize='xs'>
              {showSkeleton ? (
                <>
                  <Text>{messages.loading}</Text>
                  <Skeleton className={styles.skeleton} height='20px' />
                </>
              ) : null}
            </UserLink>
          </Flex>
          {coSign && (
            <Text
              variant='label'
              size='s'
              strength='strong'
              className={cn(styles.coSignLabel)}
            >
              {messages.coSign}
            </Text>
          )}
        </div>
        {coSign ? (
          <Text variant='body' size='xs' className={styles.coSignText}>
            <div className={styles.name}>
              {coSign.user.name}
              <UserBadges userId={coSign.user.user_id} badgeSize={8} />
            </div>
            {formatCoSign({
              hasReposted: coSign.has_remix_author_reposted,
              hasFavorited: coSign.has_remix_author_saved
            })}
          </Text>
        ) : null}
        <Text variant='body' size='xs' className={styles.statsRow}>
          <div className={styles.stats}>
            <RankIcon
              showCrown={showRankIcon}
              index={index}
              isVisible={isTrending && !showSkeleton}
            />
            {isArtistPick ? (
              <LineupTileLabel color='accent' icon={IconStar}>
                {messages.artistPick}
              </LineupTileLabel>
            ) : !isUnlisted && id ? (
              <GatedTrackLabel trackId={id} />
            ) : null}
            <VisibilityLabel
              releaseDate={releaseDate}
              isUnlisted={isUnlisted}
              isScheduledRelease={isScheduledRelease}
            />
            {!(
              props.repostCount ||
              props.saveCount ||
              props.commentCount
            ) ? null : (
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
                <div
                  className={cn(styles.statItem, fadeIn, {
                    [styles.isHidden]:
                      !isCommentsEnabled ||
                      props.isUnlisted ||
                      props.commentsDisabled
                  })}
                  onClick={
                    !isReadonly ? props.makeGoToCommentsPage(id) : undefined
                  }
                >
                  <IconMessage
                    className={styles.favoriteButton}
                    color='subdued'
                  />
                  {formatCount(props.commentCount)}
                </div>
              </>
            )}
          </div>
          <Text
            variant='body'
            size='xs'
            className={cn(styles.bottomRight, fadeIn)}
          >
            {!isLoading
              ? renderLockedContentOrPlayCount({
                  trackId: id,
                  hasStreamAccess,
                  isOwner,
                  isStreamGated,
                  streamConditions,
                  listenCount,
                  gatedTrackStatus,
                  variant,
                  lockedContentType: isPurchase ? 'premium' : 'gated',
                  onClickGatedUnlockPill: onClickPill
                })
              : null}
          </Text>
        </Text>
        {isReadonly ? null : (
          <BottomButtons
            hasSaved={props.hasCurrentUserSaved}
            hasReposted={props.hasCurrentUserReposted}
            toggleRepost={onToggleRepost}
            toggleSave={onToggleSave}
            onShare={onClickShare}
            onClickOverflow={onClickOverflowMenu}
            renderOverflow={renderOverflow}
            onClickGatedUnlockPill={onClickPill}
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
            contentId={id}
            contentType='track'
          />
        )}
      </div>
    </div>
  )
}

export default TrackTile
