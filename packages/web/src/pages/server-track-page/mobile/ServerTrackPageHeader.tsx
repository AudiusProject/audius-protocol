import { useCallback } from 'react'

import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID,
  CoverArtSizes,
  FieldVisibility,
  Remix,
  AccessConditions
} from '@audius/common/models'
import { CommonState, OverflowAction } from '@audius/common/store'
import {
  Flex,
  IconCollectible,
  IconPause,
  IconPlay,
  IconSpecialAccess,
  IconCart,
  Box,
  Button
} from '@audius/harmony'
import cn from 'classnames'
import { shallowEqual, useSelector } from 'react-redux'

import { ServerUserLink } from 'components/link/ServerUserLink'
import { SearchTag } from 'components/search/SearchTag'
import { ServerUserGeneratedText } from 'components/user-generated-text/ServerUserGeneratedText'
import { moodMap } from 'utils/Moods'
import { formatDate, formatSeconds } from 'utils/dateUtils'

import styles from '../../track-page/components/mobile/TrackHeader.module.css'

import { ServerActionButtonRow } from './ServerActionButtonRow'
import { ServerHiddenTrackHeader } from './ServerHiddenTrackHeader'
import { ServerStatsButtonRow } from './ServerStatsButtonRow'

const messages = {
  track: 'TRACK',
  remix: 'REMIX',
  play: 'PLAY',
  preview: 'PREVIEW',
  pause: 'PAUSE',
  collectibleGated: 'COLLECTIBLE GATED',
  premiumTrack: 'PREMIUM TRACK',
  specialAccess: 'SPECIAL ACCESS',
  generatedWithAi: 'Generated With AI',
  artworkAltText: 'Track Artwork'
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
      variant='primary'
      iconLeft={playing ? IconPause : IconPlay}
      onClick={onPlay}
      fullWidth
    >
      {playing ? messages.pause : messages.play}
    </Button>
  )
}

type ServerTrackPageHeaderProps = {
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
  trackArtworkSrc?: string
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
  streamConditions: AccessConditions | null
  hasStreamAccess: boolean
  hasDownloadAccess: boolean
  isRemix: boolean
  fieldVisibility: FieldVisibility
  coSign: Remix | null
  aiAttributedUserId: ID | null
  onClickMobileOverflow: (
    trackId: ID,
    overflowActions: OverflowAction[]
  ) => void
  onPlay: () => void
  onPreview: () => void
  onShare: () => void
  onSave: () => void
  onRepost: () => void
  goToFavoritesPage: (trackId: ID) => void
  goToRepostsPage: (trackId: ID) => void
}

export const ServerTrackPageHeader = ({
  title,
  trackId,
  userId,
  trackArtworkSrc,
  description = '',
  isOwner = false,
  released,
  duration,
  isPlaying,
  isPreviewing,
  isUnlisted,
  isStreamGated,
  streamConditions,
  hasStreamAccess,
  isRemix,
  fieldVisibility,
  saveCount = 0,
  repostCount,
  listenCount,
  mood,
  credits,
  genre,
  tags,
  onPlay = () => {},
  goToFavoritesPage,
  goToRepostsPage
}: ServerTrackPageHeaderProps) => {
  const track = useSelector(
    (state: CommonState) => state.tracks.entries[trackId],
    shallowEqual
  )
  const hasDownloadableAssets =
    // @ts-ignore
    track?.is_downloadable || (track?._stems?.length ?? 0) > 0

  const showListenCount =
    isOwner || (!isStreamGated && (isUnlisted || fieldVisibility.play_count))

  const filteredTags = (tags || '').split(',').filter(Boolean)

  const trackLabels: { isHidden?: boolean; label: string; value: any }[] = [
    {
      label: 'Duration',
      value: formatSeconds(duration)
    },
    {
      label: 'Genre',
      isHidden: isUnlisted && !fieldVisibility?.genre,
      value: genre
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

  const imageElement = (
    <Box
      className={cn(styles.coverArt, styles.imageWrapper)}
      css={{ overflow: 'hidden' }}
    >
      <img
        css={{
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          objectFit: 'cover'
        }}
        src={trackArtworkSrc}
        alt='Track Artwork'
      />
    </Box>
  )

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
      {isUnlisted ? (
        <div className={styles.hiddenTrackHeaderWrapper}>
          <ServerHiddenTrackHeader />
        </div>
      ) : (
        renderHeaderText()
      )}
      {imageElement}
      <div className={styles.titleArtistSection}>
        <h1 className={styles.title}>{title}</h1>
        <ServerUserLink
          userId={userId}
          variant='visible'
          textVariant='body'
          size='l'
        />
      </div>
      <PlayButton
        disabled={!hasStreamAccess}
        playing={isPlaying && !isPreviewing}
        onPlay={onPlay}
      />
      <ServerActionButtonRow />
      <ServerStatsButtonRow
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

      {description ? (
        <ServerUserGeneratedText
          className={styles.description}
          linkSource='track page'
        >
          {description}
        </ServerUserGeneratedText>
      ) : null}
      <div className={cn(styles.infoSection, styles.withSectionDivider)}>
        {renderTrackLabels()}
      </div>
      {renderTags()}

      {hasDownloadableAssets ? <Box pt='l' w='100%' /> : null}
    </div>
  )
}
