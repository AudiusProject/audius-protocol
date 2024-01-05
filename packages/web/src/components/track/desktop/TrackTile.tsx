import { memo } from 'react'

import {
  formatCount,
  accountSelectors,
  playbackPositionSelectors,
  FeatureFlags,
  formatLineupTileDuration,
  Genre,
  CommonState,
  getDogEarType,
  isPremiumContentUSDCPurchaseGated,
  usePremiumContentPurchaseModal,
  ModalSource
} from '@audius/common'
import { IconCheck, IconCrown, IconHidden, ProgressBar } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'
import { useSelector } from 'react-redux'

import IconStar from 'assets/img/iconStar.svg'
import IconVolume from 'assets/img/iconVolume.svg'
import { DogEar } from 'components/dog-ear'
import { Link } from 'components/link'
import { ScheduledReleaseLabel } from 'components/scheduled-release-label/ScheduledReleaseLabel'
import Skeleton from 'components/skeleton/Skeleton'
import typeStyles from 'components/typography/typography.module.css'
import { useAuthenticatedClickCallback } from 'hooks/useAuthenticatedCallback'
import { useFlag } from 'hooks/useRemoteConfig'

import { LockedStatusBadge, LockedStatusBadgeProps } from '../LockedStatusBadge'
import { PremiumContentLabel } from '../PremiumContentLabel'
import { messages } from '../trackTileMessages'
import {
  TrackTileSize,
  DesktopTrackTileProps as TrackTileProps
} from '../types'

import { BottomRow } from './BottomRow'
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

const renderLockedOrPlaysContent = ({
  doesUserHaveAccess,
  fieldVisibility,
  isOwner,
  isPremium,
  listenCount,
  variant
}: Pick<
  TrackTileProps,
  | 'doesUserHaveAccess'
  | 'fieldVisibility'
  | 'isOwner'
  | 'isPremium'
  | 'listenCount'
> &
  Pick<LockedStatusBadgeProps, 'variant'>) => {
  if (isPremium && !isOwner) {
    return <LockedStatusBadge locked={!doesUserHaveAccess} variant={variant} />
  }

  const hidePlays = fieldVisibility
    ? !isOwner && fieldVisibility.play_count === false
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

const TrackTile = ({
  size,
  order,
  standalone,
  isFavorited,
  isReposted,
  isOwner,
  isUnlisted,
  isScheduledRelease,
  isPremium,
  premiumConditions,
  doesUserHaveAccess,
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
  trackId,
  releaseDate
}: TrackTileProps) => {
  const { isEnabled: isNewPodcastControlsEnabled } = useFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isScheduledReleasesEnabled } = useFlag(
    FeatureFlags.SCHEDULED_RELEASES
  )

  const currentUserId = useSelector(getUserId)
  const trackPositionInfo = useSelector((state: CommonState) =>
    getTrackPosition(state, { trackId, userId: currentUserId })
  )

  const hasOrdering = order !== undefined
  const isLongFormContent =
    genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS

  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const isPurchase = isPremiumContentUSDCPurchaseGated(premiumConditions)

  const onClickPremiumPill = useAuthenticatedClickCallback(() => {
    if (isPurchase && trackId) {
      openPremiumContentPurchaseModal(
        { contentId: trackId },
        { source: ModalSource.TrackTile }
      )
    } else if (trackId && !doesUserHaveAccess && onClickLocked) {
      onClickLocked()
    }
  }, [
    isPurchase,
    trackId,
    openPremiumContentPurchaseModal,
    doesUserHaveAccess,
    onClickLocked
  ])

  const getDurationText = () => {
    if (duration === null || duration === undefined) {
      return ''
    } else if (
      isLongFormContent &&
      isNewPodcastControlsEnabled &&
      trackPositionInfo
    ) {
      if (trackPositionInfo.status === 'IN_PROGRESS') {
        const remainingTime = duration - trackPositionInfo.playbackPosition
        return (
          <div className={styles.progressTextContainer}>
            <p className={styles.progressText}>
              {`${formatLineupTileDuration(remainingTime, true)} ${
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
      return formatLineupTileDuration(duration, isLongFormContent)
    }
  }

  const dogEarType = isLoading
    ? undefined
    : getDogEarType({
        doesUserHaveAccess,
        isArtistPick,
        isOwner,
        isUnlisted:
          isUnlisted &&
        (!releaseDate || moment(releaseDate).isBefore(moment())),
        premiumConditions
      })

  let specialContentLabel = null
  let scheduledReleaseLabel = null
  if (!isLoading) {
    if (isPremium) {
      specialContentLabel = (
        <PremiumContentLabel
          premiumConditions={premiumConditions}
          doesUserHaveAccess={!!doesUserHaveAccess}
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
    } else if (isScheduledReleasesEnabled) {
      scheduledReleaseLabel = (
        <ScheduledReleaseLabel released={releaseDate} isUnlisted={isUnlisted} />
      )
    }
  }

  return (
    <div
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
      {dogEarType ? (
        <div className={styles.borderOffset}>
          <DogEar type={dogEarType} />
        </div>
      ) : null}
      <div
        className={cn(styles.body, {
          // if track and not playlist/album
          [styles.withoutHeader]: true
        })}
      >
        <div className={cn(styles.topSection)}>
          {size === TrackTileSize.LARGE ? (
            <div
              className={cn(
                typeStyles.labelXSmall,
                typeStyles.labelWeak,
                styles.headerRow
              )}
            >
              {!isLoading && header && <div>{header}</div>}
            </div>
          ) : null}
          <div className={styles.titleRow}>
            {isLoading ? (
              <Skeleton width='80%' className={styles.skeleton} />
            ) : (
              <Link
                variant='title'
                to={permalink}
                className={styles.title}
                onClick={onClickTitle}
              >
                {title}
                {isPlaying ? (
                  <IconVolume className={styles.volumeIcon} />
                ) : null}
              </Link>
            )}
          </div>
          <div
            className={cn(
              typeStyles.titleMedium,
              typeStyles.titleWeak,
              styles.creatorRow
            )}
          >
            {isLoading ? (
              <Skeleton width='50%' className={styles.skeleton} />
            ) : (
              userName
            )}
          </div>

          <div
            className={cn(
              typeStyles.body,
              typeStyles.bodyXSmall,
              styles.socialsRow
            )}
          >
            {isLoading ? (
              <Skeleton width='30%' className={styles.skeleton} />
            ) : (
              <>
                {specialContentLabel}
                {scheduledReleaseLabel}
                {isUnlisted ? null : stats}
              </>
            )}
          </div>
          <div
            className={cn(
              typeStyles.body,
              typeStyles.bodyXSmall,
              styles.topRight
            )}
          >
            {isUnlisted && !isScheduledRelease ? (
              <div className={styles.topRightIconLabel}>
                <IconHidden className={styles.topRightIcon} />
                {messages.hiddenTrack}
              </div>
            ) : null}
            {!isLoading && duration !== null && duration !== undefined ? (
              <div className={styles.duration}>{getDurationText()}</div>
            ) : null}
          </div>
          <div
            className={cn(
              typeStyles.body,
              typeStyles.bodyXSmall,
              styles.bottomRight
            )}
          >
            {!isLoading
              ? renderLockedOrPlaysContent({
                  doesUserHaveAccess,
                  fieldVisibility,
                  isOwner,
                  isPremium,
                  listenCount,
                  variant: isPurchase ? 'premium' : 'gated'
                })
              : null}
          </div>
        </div>
        <div className={styles.divider} />
        <BottomRow
          doesUserHaveAccess={doesUserHaveAccess}
          isDisabled={isDisabled}
          isLoading={isLoading}
          isFavorited={isFavorited}
          isReposted={isReposted}
          rightActions={rightActions}
          bottomBar={bottomBar}
          isUnlisted={isUnlisted}
          fieldVisibility={fieldVisibility}
          isOwner={isOwner}
          isDarkMode={isDarkMode}
          isMatrixMode={isMatrixMode}
          showIconButtons={showIconButtons}
          onClickRepost={onClickRepost}
          onClickFavorite={onClickFavorite}
          onClickShare={onClickShare}
          onClickPremiumPill={onClickPremiumPill}
          premiumConditions={premiumConditions}
          isTrack={isTrack}
          trackId={trackId}
        />
      </div>
    </div>
  )
}

export default memo(TrackTile)
