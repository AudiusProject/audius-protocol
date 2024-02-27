import { Suspense, useCallback } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { useFeatureFlag } from '@audius/common/hooks'
import {
  SquareSizes,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID,
  CoverArtSizes,
  FieldVisibility,
  Remix,
  AccessConditions
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  CommonState,
  OverflowAction,
  cacheTracksSelectors
} from '@audius/common/store'
import {
  getCanonicalName,
  formatSeconds,
  formatDate,
  getDogEarType,
  Nullable
} from '@audius/common/utils'
import {
  Flex,
  IconRobot,
  IconCollectible,
  IconPause,
  IconPlay,
  IconSpecialAccess,
  IconCart,
  Box
} from '@audius/harmony'
import { Button, ButtonSize, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { shallowEqual, useSelector } from 'react-redux'

import CoSign from 'components/co-sign/CoSign'
import HoverInfo from 'components/co-sign/HoverInfo'
import { Size } from 'components/co-sign/types'
import { DogEar } from 'components/dog-ear'
import DownloadButtons from 'components/download-buttons/DownloadButtons'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link'
import { SearchTag } from 'components/search/SearchTag'
import { AiTrackSection } from 'components/track/AiTrackSection'
import Badge from 'components/track/Badge'
import { DownloadSection } from 'components/track/DownloadSection'
import { GatedTrackSection } from 'components/track/GatedTrackSection'
import { UserGeneratedText } from 'components/user-generated-text'
import { useFlag } from 'hooks/useRemoteConfig'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { moodMap } from 'utils/Moods'
import { isDarkMode } from 'utils/theme/theme'
import { trpc } from 'utils/trpcClientWeb'

import HiddenTrackHeader from '../HiddenTrackHeader'

import ActionButtonRow from './ActionButtonRow'
import StatsButtonRow from './StatsButtonRow'
import styles from './TrackHeader.module.css'

const messages = {
  track: 'TRACK',
  remix: 'REMIX',
  play: 'PLAY',
  preview: 'PREVIEW',
  pause: 'PAUSE',
  collectibleGated: 'COLLECTIBLE GATED',
  premiumTrack: 'PREMIUM TRACK',
  specialAccess: 'SPECIAL ACCESS',
  generatedWithAi: 'Generated With AI'
}

type PlayButtonProps = {
  disabled?: boolean
  playing: boolean
  onPlay: () => void
}

const PlayButton = ({ disabled, playing, onPlay }: PlayButtonProps) => {
  return (
    <Button
      disabled={disabled}
      type={ButtonType.PRIMARY_ALT}
      text={playing ? messages.pause : messages.play}
      leftIcon={playing ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      size={ButtonSize.LARGE}
      fullWidth
    />
  )
}

const PreviewButton = ({ playing, onPlay }: PlayButtonProps) => {
  return (
    <Button
      type={ButtonType.SECONDARY}
      text={playing ? messages.pause : messages.preview}
      leftIcon={playing ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
      fullWidth
    />
  )
}

type TrackHeaderProps = {
  isLoading: boolean
  isPlaying: boolean
  isPreviewing: boolean
  isOwner: boolean
  isSaved: boolean
  isReposted: boolean
  isFollowing: boolean
  title: string
  trackId: ID
  userId: ID
  coverArtSizes: CoverArtSizes | null
  description: string
  released: string
  genre: string
  mood: string
  credits: string
  tags: string
  listenCount: number
  duration: number
  saveCount: number
  repostCount: number
  isUnlisted: boolean
  isStreamGated: boolean
  streamConditions: Nullable<AccessConditions>
  hasStreamAccess: boolean
  hasDownloadAccess: boolean
  isRemix: boolean
  fieldVisibility: FieldVisibility
  coSign: Remix | null
  aiAttributedUserId: Nullable<ID>
  onClickMobileOverflow: (
    trackId: ID,
    overflowActions: OverflowAction[]
  ) => void
  onPlay: () => void
  onPreview: () => void
  onShare: () => void
  onSave: () => void
  onRepost: () => void
  onDownload: ({
    trackId,
    category,
    parentTrackId
  }: {
    trackId: ID
    category?: string
    parentTrackId?: ID
  }) => void
  goToFavoritesPage: (trackId: ID) => void
  goToRepostsPage: (trackId: ID) => void
}

const TrackHeader = ({
  title,
  trackId,
  userId,
  coverArtSizes,
  description,
  isOwner,
  isFollowing,
  released,
  duration,
  isLoading,
  isPlaying,
  isPreviewing,
  isSaved,
  isReposted,
  isUnlisted,
  isStreamGated,
  streamConditions,
  hasStreamAccess,
  hasDownloadAccess,
  isRemix,
  fieldVisibility,
  coSign,
  saveCount,
  repostCount,
  listenCount,
  mood,
  credits,
  genre,
  tags,
  aiAttributedUserId,
  onPlay,
  onPreview,
  onShare,
  onSave,
  onRepost,
  onDownload,
  onClickMobileOverflow,
  goToFavoritesPage,
  goToRepostsPage
}: TrackHeaderProps) => {
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const { getTrack } = cacheTracksSelectors
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const hasDownloadableAssets =
    track?.is_downloadable || (track?._stems?.length ?? 0) > 0

  const showSocials = !isUnlisted && hasStreamAccess
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)
  // Preview button is shown for USDC-gated tracks if user does not have access
  // or is the owner
  const showPreview = isUSDCPurchaseGated && (isOwner || !hasStreamAccess)
  // Play button is conditionally hidden for USDC-gated tracks when the user does not have access
  const showPlay = isUSDCPurchaseGated ? hasStreamAccess : true
  const showListenCount =
    isOwner || (!isStreamGated && (isUnlisted || fieldVisibility.play_count))
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId },
    { enabled: !!trackId }
  )

  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480
  )
  const onSaveHeroTrack = () => {
    if (!isOwner) onSave()
  }
  const filteredTags = (tags || '').split(',').filter(Boolean)

  const trackLabels: { isHidden?: boolean; label: string; value: any }[] = [
    {
      label: 'Duration',
      value: formatSeconds(duration)
    },
    {
      label: 'Genre',
      isHidden: isUnlisted && !fieldVisibility?.genre,
      value: getCanonicalName(genre)
    },
    { value: formatDate(released), label: 'Released', isHidden: isUnlisted },
    {
      isHidden: isUnlisted && !fieldVisibility?.mood,
      label: 'Mood',
      // @ts-ignore
      value: mood && mood in moodMap ? moodMap[mood] : mood
    },
    { label: 'Credit', value: credits }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  const onClickOverflow = () => {
    const overflowActions = [
      isOwner || !showSocials
        ? null
        : isReposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || !showSocials
        ? null
        : isSaved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      isEditAlbumsEnabled && isOwner ? OverflowAction.ADD_TO_ALBUM : null,
      !isStreamGated ? OverflowAction.ADD_TO_PLAYLIST : null,
      isEditAlbumsEnabled && albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      isFollowing
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    onClickMobileOverflow(trackId, overflowActions)
  }

  const renderTags = () => {
    if ((isUnlisted && !fieldVisibility.tags) || filteredTags.length === 0) {
      return null
    }

    return (
      <Flex
        gap='s'
        wrap='wrap'
        justifyContent='center'
        className={styles.withSectionDivider}
      >
        {filteredTags.map((tag) => (
          <SearchTag key={tag} source='track page'>
            {tag}
          </SearchTag>
        ))}
      </Flex>
    )
  }

  const renderDownloadButtons = () => {
    return (
      <DownloadButtons
        className={cn(
          styles.downloadButtonsContainer,
          styles.withSectionDivider
        )}
        trackId={trackId}
        isOwner={isOwner}
        following={isFollowing}
        hasDownloadAccess={hasDownloadAccess}
        onDownload={onDownload}
      />
    )
  }

  const renderTrackLabels = () => {
    return trackLabels.map((infoFact) => {
      return (
        <div key={infoFact.label} className={styles.infoFact}>
          <div className={styles.infoLabel}>{infoFact.label}</div>
          <div className={styles.infoValue}>{infoFact.value}</div>
        </div>
      )
    })
  }

  const onClickFavorites = useCallback(() => {
    goToFavoritesPage(trackId)
  }, [goToFavoritesPage, trackId])

  const onClickReposts = useCallback(() => {
    goToRepostsPage(trackId)
  }, [goToRepostsPage, trackId])

  const imageElement = coSign ? (
    <CoSign
      size={Size.LARGE}
      hasFavorited={coSign.has_remix_author_saved}
      hasReposted={coSign.has_remix_author_reposted}
      coSignName={coSign.user.name}
      className={styles.coverArt}
      userId={coSign.user.user_id}
    >
      <DynamicImage image={image} wrapperClassName={styles.imageWrapper} />
    </CoSign>
  ) : (
    <DynamicImage
      image={image}
      wrapperClassName={cn(styles.coverArt, styles.imageWrapper)}
    />
  )

  const renderDogEar = () => {
    // Omitting isOwner and hasStreamAccess to ensure we always show gated DogEars
    const DogEarType = getDogEarType({
      isUnlisted,
      streamConditions
    })
    if (!isLoading && DogEarType) {
      return (
        <div className={styles.borderOffset}>
          <DogEar type={DogEarType} />
        </div>
      )
    }
    return null
  }

  const renderHeaderText = () => {
    if (isStreamGated) {
      let IconComponent = IconSpecialAccess
      let titleMessage = messages.specialAccess
      if (isContentCollectibleGated(streamConditions)) {
        IconComponent = IconCollectible
        titleMessage = messages.collectibleGated
      } else if (isContentUSDCPurchaseGated(streamConditions)) {
        IconComponent = IconCart
        titleMessage = messages.premiumTrack
      }
      return (
        <div className={cn(styles.typeLabel, styles.gatedContentLabel)}>
          <IconComponent />
          <span>{titleMessage}</span>
        </div>
      )
    }

    return (
      <div className={styles.typeLabel}>
        {isRemix ? messages.remix : messages.track}
      </div>
    )
  }

  return (
    <div className={styles.trackHeader}>
      {renderDogEar()}
      {isUnlisted ? (
        <div className={styles.hiddenTrackHeaderWrapper}>
          <HiddenTrackHeader />
        </div>
      ) : (
        renderHeaderText()
      )}
      {aiAttributedUserId ? (
        <Badge
          icon={<IconRobot />}
          className={styles.badgeAi}
          textLabel={messages.generatedWithAi}
        />
      ) : null}
      {imageElement}
      <div className={styles.titleArtistSection}>
        <h1 className={styles.title}>{title}</h1>
        <UserLink
          userId={userId}
          color='accent'
          variant='body'
          size='l'
          textAs='h2'
          badgeSize={16}
        />
      </div>
      {showPlay ? (
        <PlayButton
          disabled={!hasStreamAccess}
          playing={isPlaying && !isPreviewing}
          onPlay={onPlay}
        />
      ) : null}
      {streamConditions && trackId ? (
        <GatedTrackSection
          isLoading={isLoading}
          trackId={trackId}
          streamConditions={streamConditions}
          hasStreamAccess={hasStreamAccess}
          isOwner={isOwner}
          wrapperClassName={styles.gatedTrackSectionWrapper}
          className={styles.gatedTrackSection}
          buttonClassName={styles.gatedTrackSectionButton}
          ownerId={userId}
        />
      ) : null}
      {showPreview ? (
        <PreviewButton playing={isPlaying && isPreviewing} onPlay={onPreview} />
      ) : null}
      <ActionButtonRow
        showRepost={showSocials}
        showFavorite={showSocials}
        showShare={!isUnlisted || fieldVisibility.share || isOwner}
        showOverflow
        shareToastDisabled
        isOwner={isOwner}
        isReposted={isReposted}
        isSaved={isSaved}
        onClickOverflow={onClickOverflow}
        onRepost={onRepost}
        onFavorite={onSaveHeroTrack}
        onShare={onShare}
        darkMode={isDarkMode()}
      />
      {coSign ? (
        <div className={cn(styles.coSignInfo, styles.withSectionDivider)}>
          <HoverInfo
            coSignName={coSign.user.name}
            hasFavorited={coSign.has_remix_author_saved}
            hasReposted={coSign.has_remix_author_reposted}
            userId={coSign.user.user_id}
          />
        </div>
      ) : null}
      <StatsButtonRow
        className={styles.withSectionDivider}
        showListenCount={showListenCount}
        showFavoriteCount={!isUnlisted}
        showRepostCount={!isUnlisted}
        listenCount={listenCount}
        favoriteCount={saveCount}
        repostCount={repostCount}
        onClickFavorites={onClickFavorites}
        onClickReposts={onClickReposts}
      />
      {aiAttributedUserId ? (
        <AiTrackSection
          attributedUserId={aiAttributedUserId}
          className={cn(styles.aiSection, styles.withSectionDivider)}
          descriptionClassName={styles.aiSectionDescription}
        />
      ) : null}
      {description ? (
        <UserGeneratedText
          className={styles.description}
          linkSource='track page'
        >
          {description}
        </UserGeneratedText>
      ) : null}
      <div className={cn(styles.infoSection, styles.withSectionDivider)}>
        {renderTrackLabels()}
      </div>
      {renderTags()}
      {!isLosslessDownloadsEnabled ? renderDownloadButtons() : null}
      {isLosslessDownloadsEnabled && hasDownloadableAssets ? (
        <Box pt='l' w='100%'>
          <Suspense>
            <DownloadSection trackId={trackId} />
          </Suspense>
        </Box>
      ) : null}
    </div>
  )
}

TrackHeader.defaultProps = {
  loading: false,
  playing: false,
  active: true,
  coverArtUrl: placeholderArt,
  artistVerified: false,
  description: '',

  isOwner: false,
  isAlbum: false,
  hasTracks: false,
  isPublished: false,
  isSaved: false,

  saveCount: 0,
  tags: [],
  onPlay: () => {}
}

export default TrackHeader
