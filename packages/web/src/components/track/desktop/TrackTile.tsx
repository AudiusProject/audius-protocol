import { memo, useCallback } from 'react'

import { ModalSource, isContentUSDCPurchaseGated } from '@audius/common/models'
import { useFeatureFlag } from '@audius/common/src/hooks/useFeatureFlag'
import { FeatureFlags } from '@audius/common/src/services/remote-config/feature-flags'
import {
  accountSelectors,
  usePremiumContentPurchaseModal,
  playbackPositionSelectors,
  CommonState,
  PurchaseableContentType
} from '@audius/common/store'
import { Genre, formatLineupTileDuration } from '@audius/common/utils'
import {
  IconVolumeLevel2 as IconVolume,
  IconCheck,
  IconCrown,
  Text,
  Flex,
  ProgressBar,
  Paper
} from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { CollectionDogEar } from 'components/collection'
import { CollectionTileStats } from 'components/collection/CollectionTileStats'
import { TextLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'

import { OwnerActionButtons } from '../OwnerActionButtons'
import { TrackDogEar } from '../TrackDogEar'
import { TrackTileStats } from '../TrackTileStats'
import { ViewerActionButtons } from '../ViewerActionButtons'
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
  isLoading,
  index
}: {
  hasOrdering: boolean
  isLoading: boolean
  index: number
}) => {
  return (
    <>
      {hasOrdering && (
        <div className={styles.order}>
          {!isLoading && index <= 5 && (
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

const TrackTile = ({
  size,
  order,
  standalone,
  isOwner,
  streamConditions,
  hasStreamAccess,
  isActive,
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
  permalink,
  isTrack,
  collectionId,
  trackId,
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

  const onClickGatedUnlockPillRequiresAccount =
    useRequiresAccountOnClick(() => {
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

  const onClickGatedUnlockPill = useCallback(() => {
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
    hasStreamAccess,
    onClickLocked,
    openPremiumContentPurchaseModal,
    source
  ])

  const { isEnabled: isGuestCheckoutEnabled } = useFeatureFlag(
    FeatureFlags.GUEST_CHECKOUT
  )

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
      {trackId ? <TrackDogEar trackId={trackId} hideUnlocked /> : null}
      {collectionId ? (
        <CollectionDogEar collectionId={collectionId} hideUnlocked />
      ) : null}
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
                  css={{ alignItems: 'center' }}
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
          {trackId ? (
            <TrackTileStats
              trackId={trackId}
              rankIndex={order}
              size={size}
              isLoading={isLoading}
            />
          ) : null}
          {collectionId ? (
            <CollectionTileStats
              collectionId={collectionId}
              isLoading={isLoading}
              size={size}
            />
          ) : null}
          <Text variant='body' size='xs' className={styles.topRight}>
            {!isLoading && duration !== null && duration !== undefined ? (
              <div className={styles.duration}>{getDurationText()}</div>
            ) : null}
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
                onClickGatedUnlockPill={
                  isGuestCheckoutEnabled
                    ? onClickGatedUnlockPill
                    : onClickGatedUnlockPillRequiresAccount
                }
              />
            )}
          </>
        ) : null}
      </div>
    </Root>
  )
}

export default memo(TrackTile)
