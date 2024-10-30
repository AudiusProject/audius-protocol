import { memo } from 'react'

import { ModalSource, isContentUSDCPurchaseGated } from '@audius/common/models'
import {
  accountSelectors,
  usePremiumContentPurchaseModal,
  playbackPositionSelectors,
  CommonState,
  PurchaseableContentType
} from '@audius/common/store'
import {
  formatCount,
  Genre,
  formatLineupTileDuration
} from '@audius/common/utils'
import {
  IconVolumeLevel2 as IconVolume,
  IconCheck,
  IconCrown,
  Text,
  Flex,
  ProgressBar,
  Paper,
  IconStar
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { CollectionDogEar } from 'components/collection'
import { TextLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'

import {
  LockedStatusPill,
  LockedStatusPillProps
} from '../../locked-status-pill'
import { GatedTrackLabel } from '../GatedTrackLabel'
import { LineupTileLabel } from '../LineupTileLabel'
import { OwnerActionButtons } from '../OwnerActionButtons'
import { TrackDogEar } from '../TrackDogEar'
import { ViewerActionButtons } from '../ViewerActionButtons'
import { VisibilityLabel } from '../VisibilityLabel'
import { messages } from '../trackTileMessages'
import {
  TrackTileSize,
  DesktopTrackTileProps as TrackTileProps
} from '../types'

import styles from './TrackTile.module.css'

const { getUserId } = accountSelectors
const { getTrackPosition } = playbackPositionSelectors

const RankAndIndexIndicator = ({
  hasOrdering,
  showCrownIcon,
  isLoading,
  index
}: {
  hasOrdering: boolean
  showCrownIcon: boolean
  isLoading: boolean
  index: number
}) => {
  return (
    <>
      {hasOrdering && (
        <div className={styles.order}>
          {showCrownIcon && (
            <div className={styles.crownContainer}>
              <IconCrown />
            </div>
          )}
          {!isLoading && index}
        </div>
      )}
    </>
  )
}

const renderLockedContentOrPlayCount = ({
  hasStreamAccess,
  isOwner,
  isStreamGated,
  listenCount,
  variant
}: Pick<
  TrackTileProps,
  | 'hasStreamAccess'
  | 'fieldVisibility'
  | 'isOwner'
  | 'isStreamGated'
  | 'listenCount'
> &
  Pick<LockedStatusPillProps, 'variant'>) => {
  if (isStreamGated && !isOwner) {
    return <LockedStatusPill locked={!hasStreamAccess} variant={variant} />
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

const TrackTile = ({
  size,
  order,
  standalone,
  isOwner,
  isUnlisted,
  isScheduledRelease,
  isStreamGated,
  streamConditions,
  hasStreamAccess,
  listenCount,
  isActive,
  isArtistPick,
  isDisabled,
  isLoading,
  isPlaying,
  artwork,
  rightActions,
  header,
  title,
  genre,
  userName,
  duration,
  stats,
  fieldVisibility,
  bottomBar,
  isDarkMode,
  isMatrixMode,
  showIconButtons = true,
  containerClassName,
  onClickTitle,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onClickLocked,
  onTogglePlay,
  showRankIcon,
  permalink,
  isTrack,
  collectionId,
  trackId,
  releaseDate,
  source
}: TrackTileProps) => {
  const currentUserId = useSelector(getUserId)
  const trackPositionInfo = useSelector((state: CommonState) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )

  const hasOrdering = order !== undefined
  const isLongFormContent =
    genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS

  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const onClickGatedUnlockPill = useAuthenticatedClickCallback(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        { contentId: trackId, contentType: PurchaseableContentType.TRACK },
        { source: source ?? ModalSource.TrackTile }
      )
    } else if (trackId && !hasStreamAccess && onClickLocked) {
      onClickLocked()
    }
  }, [
    isPurchase,
    trackId,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    onClickLocked
  ])

  const getDurationText = () => {
    if (duration === null || duration === undefined) {
      return ''
    } else if (isLongFormContent && trackPositionInfo) {
      if (trackPositionInfo.status === 'IN_PROGRESS') {
        const remainingTime = duration - trackPositionInfo.playbackPosition
        return (
          <div className={styles.progressTextContainer}>
            <p className={styles.progressText}>
              {`${formatLineupTileDuration(remainingTime, true, !isTrack)} ${
                messages.timeLeft
              }`}
            </p>
            <ProgressBar
              value={(trackPositionInfo.playbackPosition / duration) * 100}
              sliderClassName={styles.progressTextSlider}
            />
          </div>
        )
      } else if (trackPositionInfo.status === 'COMPLETED') {
        return (
          <div className={styles.completeText}>
            {messages.played}
            <IconCheck className={styles.completeIcon} />
          </div>
        )
      }
    } else {
      return formatLineupTileDuration(duration, isLongFormContent, !isTrack)
    }
  }

  const Root = standalone ? Paper : 'div'

  return (
    <Root
      className={cn(styles.container, {
        [containerClassName!]: !!containerClassName,
        // Active indicates that the track is the current queue item
        [styles.isActive]: isActive,
        [styles.isDisabled]: isDisabled,

        [styles.large]: size === TrackTileSize.LARGE,
        [styles.small]: size === TrackTileSize.SMALL,

        // Standalone means that this tile is not w/ a playlist
        [styles.standalone]: !!standalone
      })}
      onClick={!isLoading && !isDisabled ? onTogglePlay : undefined}
    >
      {/* prefix ordering */}
      <RankAndIndexIndicator
        hasOrdering={hasOrdering}
        showCrownIcon={showRankIcon}
        isLoading={!!isLoading}
        index={order ?? 0}
      />
      {/* Track tile image */}
      <div
        className={cn(styles.imageContainer, {
          [styles.leftSpacing]: !hasOrdering
        })}
      >
        {artwork}
      </div>
      {trackId ? <TrackDogEar trackId={trackId} /> : null}
      {collectionId ? <CollectionDogEar collectionId={collectionId} /> : null}
      <div className={styles.body}>
        <Flex inline direction='column' h='100%' justifyContent='space-between'>
          {size === TrackTileSize.LARGE ? (
            <Text
              variant='label'
              strength='default'
              textAlign='left'
              color='subdued'
            >
              {isLoading || !header ? null : header}
            </Text>
          ) : null}
          <Flex direction='column' gap='2xs' mb={header ? 'xs' : 's'}>
            {isLoading ? (
              <Skeleton width='80%' height='20px' />
            ) : (
              <Flex css={{ marginRight: 132 }}>
                <TextLink
                  to={permalink}
                  isActive={isActive}
                  textVariant='title'
                  applyHoverStylesToInnerSvg
                  onClick={onClickTitle}
                  disabled={isDisabled}
                  ellipses
                >
                  <Text ellipses>{title}</Text>
                  {isPlaying ? <IconVolume size='m' /> : null}
                </TextLink>
              </Flex>
            )}
            {isLoading ? <Skeleton width='50%' height='20px' /> : userName}
          </Flex>

          <Text variant='body' size='xs' className={styles.socialsRow}>
            {isLoading ? (
              <Skeleton width='30%' className={styles.skeleton} />
            ) : (
              <>
                {isArtistPick ? (
                  <LineupTileLabel color='accent' icon={IconStar}>
                    {messages.artistPick}
                  </LineupTileLabel>
                ) : null}
                {!isUnlisted && trackId ? (
                  <GatedTrackLabel trackId={trackId} />
                ) : null}
                <VisibilityLabel
                  releaseDate={releaseDate}
                  isUnlisted={isUnlisted}
                  isScheduledRelease={isScheduledRelease}
                />
                {isUnlisted ? null : stats}
              </>
            )}
          </Text>
          <Text variant='body' size='xs' className={styles.topRight}>
            {!isLoading && duration !== null && duration !== undefined ? (
              <div className={styles.duration}>{getDurationText()}</div>
            ) : null}
          </Text>
          <Text variant='body' size='xs' className={styles.bottomRight}>
            {!isLoading
              ? renderLockedContentOrPlayCount({
                  hasStreamAccess,
                  fieldVisibility,
                  isOwner,
                  isStreamGated,
                  listenCount,
                  variant: isPurchase ? 'premium' : 'gated'
                })
              : null}
          </Text>
        </Flex>
        {isTrack && trackId ? (
          <>
            <div className={styles.divider} />
            {isOwner ? (
              <OwnerActionButtons
                contentId={trackId}
                contentType='track'
                isDisabled={isDisabled}
                isLoading={isLoading}
                rightActions={rightActions}
                bottomBar={bottomBar}
                isDarkMode={isDarkMode}
                isMatrixMode={isMatrixMode}
                showIconButtons={showIconButtons}
                onClickShare={onClickShare}
              />
            ) : (
              <ViewerActionButtons
                contentId={trackId}
                contentType='track'
                hasStreamAccess={hasStreamAccess}
                isDisabled={isDisabled}
                isLoading={isLoading}
                rightActions={rightActions}
                bottomBar={bottomBar}
                isDarkMode={isDarkMode}
                isMatrixMode={isMatrixMode}
                showIconButtons={showIconButtons}
                onClickRepost={onClickRepost}
                onClickFavorite={onClickFavorite}
                onClickShare={onClickShare}
                onClickGatedUnlockPill={onClickGatedUnlockPill}
              />
            )}
          </>
        ) : null}
      </div>
    </Root>
  )
}

export default memo(TrackTile)
