import { Suspense, lazy, useCallback, useState } from 'react'

import {
  useGetCurrentUserId,
  useGetTrackById,
  useGetUserById
} from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { isContentUSDCPurchaseGated, ID, Track } from '@audius/common/models'
import {
  PurchaseableContentType,
  useEarlyReleaseConfirmationModal,
  usePublishConfirmationModal
} from '@audius/common/store'
import {
  Genre,
  getDogEarType,
  Nullable,
  formatReleaseDate
} from '@audius/common/utils'
import {
  Text,
  Box,
  Flex,
  IconRepost,
  IconHeart,
  IconKebabHorizontal,
  IconShare,
  IconRocket,
  Button,
  MusicBadge
} from '@audius/harmony'
import IconCalendarMonth from '@audius/harmony/src/assets/icons/CalendarMonth.svg'
import IconRobot from '@audius/harmony/src/assets/icons/Robot.svg'
import IconTrending from '@audius/harmony/src/assets/icons/Trending.svg'
import IconVisibilityHidden from '@audius/harmony/src/assets/icons/VisibilityHidden.svg'
import cn from 'classnames'
import dayjs from 'dayjs'

import { UserLink } from 'components/link'
import Menu from 'components/menu/Menu'
import { SearchTag } from 'components/search/SearchTag'
import Skeleton from 'components/skeleton/Skeleton'
import { Tile } from 'components/tile'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import { ComponentPlacement } from 'components/types'
import { UserGeneratedText } from 'components/user-generated-text'
import { getTrackDefaults } from 'pages/track-page/utils'

import { AiTrackSection } from './AiTrackSection'
import { CardTitle } from './CardTitle'
import { GatedContentSection } from './GatedContentSection'
import GiantArtwork from './GiantArtwork'
import styles from './GiantTrackTile.module.css'
import { GiantTrackTileProgressInfo } from './GiantTrackTileProgressInfo'
import { PlayPauseButton } from './PlayPauseButton'
import { TrackMetadataList } from './TrackMetadataList'
import { TrackStats } from './TrackStats'

const DownloadSection = lazy(() =>
  import('./DownloadSection').then((module) => ({
    default: module.DownloadSection
  }))
)

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1095,
  second: 1190,
  third: 1286
}
// Toast timeouts in ms
const REPOST_TIMEOUT = 1000
const SAVED_TIMEOUT = 1000

const messages = {
  makePublic: 'MAKE PUBLIC',
  releaseNow: 'RELEASE NOW',
  isPublishing: 'PUBLISHING',
  repostButtonText: 'repost',
  repostedButtonText: 'reposted',
  unplayed: 'Unplayed',
  timeLeft: 'left',
  played: 'Played',
  generatedWithAi: 'Generated With AI',
  actionGroupLabel: 'track actions',
  hidden: 'hidden',
  releases: (releaseDate: string) =>
    `Releases ${formatReleaseDate({ date: releaseDate, withHour: true })}`
}

export type GiantTrackTileProps = {
  id: ID
  trendingBadgeLabel: Nullable<string>
  onMakePublic: (trackId: ID) => void
  onFollow: () => void
  onPlay: () => void
  onPreview: () => void
  onRepost: () => void
  onSave: () => void
  onShare: () => void
  onUnfollow: () => void
  playing: boolean
  previewing: boolean
}

export const GiantTrackTile = (props: GiantTrackTileProps) => {
  const {
    id,
    trendingBadgeLabel,
    onFollow,
    onMakePublic,
    onPlay,
    onPreview,
    onSave,
    onShare,
    onRepost,
    onUnfollow,
    playing,
    previewing
  } = props

  const { data: currentUserId } = useGetCurrentUserId({})
  const track = (useGetTrackById({ id, currentUserId }).data ??
    undefined) as unknown as Track | undefined
  const { data: user } = useGetUserById(
    { id: track?.owner_id ?? 0 },
    { disabled: !track?.owner_id }
  )
  const isFollowing = user?.does_current_user_follow ?? false
  const { isFetchingNFTAccess, hasStreamAccess } = useGatedContentAccess(
    track ?? null
  )

  const {
    aiAttributionUserId,
    coSign,
    coverArtSizes,
    ddexApp,
    description,
    duration,
    fieldVisibility,
    genre,
    isPublishing,
    isReposted,
    isSaved,
    isScheduledRelease,
    isStreamGated,
    isUnlisted,
    listenCount,
    ownerId,
    releaseDate,
    remixParentTrackId,
    repostCount,
    saveCount,
    streamConditions,
    tags,
    title,
    trackId
  } = getTrackDefaults(track ?? null)

  const isOwner = ownerId === currentUserId
  const isRemix = !!remixParentTrackId
  const isArtistPick =
    user && track && user.artist_pick_track_id === track.track_id

  const loading = !track || isFetchingNFTAccess
  const [artworkLoading, setArtworkLoading] = useState(false)
  const onArtworkLoad = useCallback(
    () => setArtworkLoading(false),
    [setArtworkLoading]
  )
  const isLongFormContent =
    genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  const hasDownloadableAssets =
    track?.is_downloadable || (track?._stems?.length ?? 0) > 0
  // Preview button is shown for USDC-gated tracks if user does not have access
  // or is the owner
  const showPreview =
    isUSDCPurchaseGated && (isOwner || !hasStreamAccess) && track?.preview_cid
  // Play button is conditionally hidden for USDC-gated tracks when the user does not have access
  const showPlay = isUSDCPurchaseGated ? hasStreamAccess : true
  const shouldShowScheduledRelease =
    isScheduledRelease && dayjs(releaseDate).isAfter(dayjs())
  const renderCardTitle = (className: string) => {
    return (
      <CardTitle
        className={className}
        isUnlisted={isUnlisted}
        isScheduledRelease={isScheduledRelease}
        isRemix={isRemix}
        isStreamGated={isStreamGated}
        isPodcast={genre === Genre.PODCASTS}
        streamConditions={streamConditions}
      />
    )
  }

  const renderShareButton = () => {
    const shouldShow =
      (!isUnlisted && !isPublishing) || fieldVisibility.share || isOwner
    return shouldShow ? (
      <Button
        variant='secondary'
        iconLeft={IconShare}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
        onClick={onShare}
      >
        share
      </Button>
    ) : null
  }

  const { onOpen: openPublishConfirmation } = usePublishConfirmationModal()
  const { onOpen: openEarlyReleaseConfirmation } =
    useEarlyReleaseConfirmationModal()

  const renderMakePublicButton = () => {
    let text = messages.isPublishing
    if (isUnlisted && !isPublishing) {
      text = isScheduledRelease ? messages.releaseNow : messages.makePublic
    }

    return (
      (isUnlisted || isPublishing) &&
      isOwner && (
        <Button
          variant='secondary'
          isLoading={isPublishing}
          iconLeft={IconRocket}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
          onClick={() => {
            if (isScheduledRelease) {
              openEarlyReleaseConfirmation({
                contentType: 'track',
                confirmCallback: () => {
                  onMakePublic(trackId)
                }
              })
            } else {
              openPublishConfirmation({
                contentType: 'track',
                confirmCallback: () => {
                  onMakePublic(trackId)
                }
              })
            }
          }}
        >
          {text}
        </Button>
      )
    )
  }

  const renderRepostButton = () => {
    return (
      !isUnlisted &&
      !isPublishing &&
      !isOwner && (
        <Toast
          placement={ComponentPlacement.BOTTOM}
          text={'Reposted!'}
          disabled={isReposted}
          delay={REPOST_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || repostCount === 0}
            text={isReposted ? 'Unrepost' : 'Repost'}
          >
            <div>
              <Button
                variant={isReposted ? 'primary' : 'secondary'}
                name='repost'
                disabled={isOwner}
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
                iconLeft={IconRepost}
                onClick={onRepost}
              >
                {isReposted
                  ? messages.repostedButtonText
                  : messages.repostButtonText}
              </Button>
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  const renderFavoriteButton = () => {
    return (
      !isUnlisted &&
      !isOwner && (
        <Toast
          placement={ComponentPlacement.BOTTOM}
          text={'Favorited!'}
          disabled={isSaved}
          delay={SAVED_TIMEOUT}
          fillParent={false}
        >
          <Tooltip
            disabled={isOwner || saveCount === 0}
            text={isSaved ? 'Unfavorite' : 'Favorite'}
          >
            <div>
              <Button
                name='favorite'
                disabled={isOwner}
                variant={isSaved ? 'primary' : 'secondary'}
                widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
                iconLeft={IconHeart}
                onClick={onSave}
              >
                {isSaved ? 'favorited' : 'favorite'}
              </Button>
            </div>
          </Tooltip>
        </Toast>
      )
    )
  }

  const renderListenCount = () => {
    const shouldShow = isOwner || (!isStreamGated && !isUnlisted)

    if (!shouldShow) {
      return null
    }
    return (
      <div className={styles.listens}>
        {!isOwner && listenCount === 0 ? (
          <span className={styles.firstListen}>
            Be the first to listen to this track!
          </span>
        ) : (
          <>
            <span className={styles.numberOfListens}>
              {listenCount?.toLocaleString() ?? 0}
            </span>
            <span className={styles.listenText}>
              {listenCount === 1 ? 'Play' : 'Plays'}
            </span>
          </>
        )}
      </div>
    )
  }

  const renderTags = () => {
    const shouldShow = !isUnlisted || fieldVisibility.tags
    if (!shouldShow || !tags) return null
    return (
      <Flex pt='m' wrap='wrap' gap='s'>
        {tags
          .split(',')
          .filter((t) => t)
          .map((tag) => (
            <SearchTag key={tag} source='track page'>
              {tag}
            </SearchTag>
          ))}
      </Flex>
    )
  }

  const isLoading = loading || artworkLoading
  // Omitting isOwner and hasStreamAccess so that we always show gated DogEars
  const dogEarType = isLoading
    ? undefined
    : getDogEarType({
        streamConditions
      })

  const overflowMenuExtraItems = []
  if (!isOwner) {
    overflowMenuExtraItems.push({
      text: isFollowing ? 'Unfollow Artist' : 'Follow Artist',
      onClick: () =>
        setTimeout(() => (isFollowing ? onUnfollow() : onFollow()), 0)
    })
  }

  const overflowMenu = {
    menu: {
      type: 'track',
      trackId,
      trackTitle: title,
      ddexApp,
      genre,
      handle: user?.handle,
      isFavorited: isSaved,
      mount: 'page',
      isOwner,
      includeFavorite: hasStreamAccess,
      includeRepost: hasStreamAccess,
      includeShare: true,
      includeTrackPage: false,
      isArtistPick,
      isUnlisted,
      includeEmbed: !(isUnlisted || isStreamGated),
      includeArtistPick: true,
      includeAddToAlbum: isOwner && !ddexApp,
      extraMenuItems: overflowMenuExtraItems
    }
  }

  const fadeIn = {
    [styles.show]: !isLoading,
    [styles.hide]: isLoading
  }

  return (
    <Flex className={styles.giantTrackTile}>
      <Tile
        dogEar={dogEarType}
        size='large'
        elevation='mid'
        css={{ width: '100%' }}
      >
        <div className={styles.topSection}>
          <GiantArtwork
            trackId={trackId}
            coverArtSizes={coverArtSizes}
            coSign={coSign}
            callback={onArtworkLoad}
          />
          <div className={styles.infoSection}>
            <div className={styles.infoSectionHeader}>
              {renderCardTitle(cn(fadeIn))}
              <div className={styles.title}>
                <Text variant='heading' size='xl' className={cn(fadeIn)}>
                  {title}
                </Text>
                {isLoading && <Skeleton className={styles.skeleton} />}
              </div>
              <Flex>
                <Text
                  variant='title'
                  strength='weak'
                  tag='h2'
                  className={cn(fadeIn)}
                >
                  <Text color='subdued'>By </Text>
                  {ownerId ? <UserLink userId={ownerId} popover /> : null}
                </Text>
                {isLoading && (
                  <Skeleton className={styles.skeleton} width='60%' />
                )}
              </Flex>
            </div>

            <div className={cn(styles.playSection, fadeIn)}>
              {showPlay ? (
                <PlayPauseButton
                  disabled={!hasStreamAccess}
                  playing={playing && !previewing}
                  onPlay={onPlay}
                  trackId={trackId}
                />
              ) : null}
              {showPreview ? (
                <PlayPauseButton
                  playing={playing && previewing}
                  onPlay={onPreview}
                  trackId={trackId}
                  isPreview
                />
              ) : null}
              {isLongFormContent ? (
                <GiantTrackTileProgressInfo
                  duration={duration}
                  trackId={trackId}
                />
              ) : (
                renderListenCount()
              )}
            </div>

            <div className={cn(styles.statsSection, fadeIn)}>
              <TrackStats trackId={trackId} />
            </div>

            {isUnlisted && !isOwner ? null : (
              <div
                className={cn(styles.actionButtons, fadeIn)}
                role='group'
                aria-label={messages.actionGroupLabel}
              >
                {renderShareButton()}
                {renderMakePublicButton()}
                {hasStreamAccess && renderRepostButton()}
                {hasStreamAccess && renderFavoriteButton()}
                <span>
                  {/* prop types for overflow menu don't work correctly
              so we need to cast here */}
                  <Menu {...(overflowMenu as any)}>
                    {(ref, triggerPopup) => (
                      <div className={cn(styles.menuKebabContainer)} ref={ref}>
                        <Button
                          variant='secondary'
                          aria-label='More options'
                          iconLeft={IconKebabHorizontal}
                          onClick={() => triggerPopup()}
                        />
                      </div>
                    )}
                  </Menu>
                </span>
              </div>
            )}
          </div>
          <Flex
            gap='s'
            justifyContent='flex-end'
            css={{ position: 'absolute', right: 'var(--harmony-unit-6)' }}
          >
            {aiAttributionUserId ? (
              <MusicBadge icon={IconRobot} color='lightGreen'>
                {messages.generatedWithAi}
              </MusicBadge>
            ) : null}
            {trendingBadgeLabel ? (
              <MusicBadge color='blue' icon={IconTrending}>
                {trendingBadgeLabel}
              </MusicBadge>
            ) : null}
            {shouldShowScheduledRelease ? (
              <MusicBadge variant='accent' icon={IconCalendarMonth}>
                {messages.releases(releaseDate)}
              </MusicBadge>
            ) : isUnlisted ? (
              <MusicBadge icon={IconVisibilityHidden}>
                {messages.hidden}
              </MusicBadge>
            ) : null}
          </Flex>
        </div>

        {isStreamGated && streamConditions ? (
          <Box mb='xl' ph='xl' w='100%'>
            <GatedContentSection
              isLoading={isLoading}
              contentId={trackId}
              contentType={PurchaseableContentType.TRACK}
              streamConditions={streamConditions}
              hasStreamAccess={hasStreamAccess}
              isOwner={isOwner}
              ownerId={ownerId}
            />
          </Box>
        ) : null}

        {aiAttributionUserId ? (
          <AiTrackSection attributedUserId={aiAttributionUserId} />
        ) : null}

        <div className={cn(styles.bottomSection, fadeIn)}>
          <TrackMetadataList trackId={trackId} />
          {description ? (
            <UserGeneratedText tag='h3' size='s' className={styles.description}>
              {description}
            </UserGeneratedText>
          ) : null}

          {renderTags()}
          {hasDownloadableAssets ? (
            <Box pt='l' w='100%'>
              <Suspense>
                <DownloadSection trackId={trackId} />
              </Suspense>
            </Box>
          ) : null}
        </div>
      </Tile>
    </Flex>
  )
}
