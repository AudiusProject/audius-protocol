import { useCallback } from 'react'

import { useGatedContentAccessMap } from '@audius/common/hooks'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  playerSelectors,
  playbackPositionSelectors,
  cacheCollectionsSelectors
} from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import { getDogEarType, Genre, getLocalTimezone } from '@audius/common/utils'
import moment from 'moment'
import { TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Flex,
  Text,
  IconCalendarMonth,
  IconPause,
  IconPlay,
  IconRepeatOff,
  Paper,
  spacing,
  Button,
  Divider,
  Box,
  MusicBadge,
  IconVisibilityHidden
} from '@audius/harmony-native'
import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { UserGeneratedText, DogEar, Tag } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { light } from 'app/haptics'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'

import { OfflineStatusRow } from '../offline-downloads'

import { DeletedTile } from './DeletedTile'
import { DetailsProgressInfo } from './DetailsProgressInfo'
import { DetailsTileActionButtons } from './DetailsTileActionButtons'
import { DetailsTileAiAttribution } from './DetailsTileAiAttribution'
import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileMetadata } from './DetailsTileMetadata'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'
import { DetailsTileStats } from './DetailsTileStats'
import { SecondaryStats } from './SecondaryStats'
import type { DetailsTileProps } from './types'

const { getTrackId } = playerSelectors
const { getTrackPosition } = playbackPositionSelectors
const { getCollectionTracks } = cacheCollectionsSelectors

const messages = {
  play: 'Play',
  pause: 'Pause',
  resume: 'Resume',
  replay: 'Replay',
  preview: 'Preview',
  hidden: 'Hidden',
  releases: (releaseDate: string) =>
    `Releases ${moment(releaseDate).format(
      'M/D/YY [@] h:mm A'
    )} ${getLocalTimezone()}`
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 224,
    width: 224,
    alignSelf: 'center'
  }
}))

/**
 * The details shown at the top of the Track Screen and Collection Screen
 */
export const DetailsTile = ({
  contentId,
  contentType,
  coSign,
  description,
  descriptionLinkPressSource,
  hasReposted,
  hasSaved,
  hasStreamAccess,
  streamConditions,
  hideFavorite,
  hideFavoriteCount,
  hidePlayCount,
  hideOverflow,
  hideRepost,
  hideRepostCount,
  hideShare,
  isPlaying,
  isPreviewing,
  isDeleted = false,
  isPlayable = true,
  isCollection = false,
  isPublished = true,
  isUnlisted = false,
  onPressEdit,
  onPressFavorites,
  onPressOverflow,
  onPressPlay,
  onPressPreview,
  onPressPublish,
  onPressRepost,
  onPressReposts,
  onPressSave,
  onPressShare,
  playCount,
  duration,
  trackCount,
  renderBottomContent,
  renderImage,
  repostCount,
  saveCount,
  headerText,
  title,
  user,
  track,
  ddexApp,
  releaseDate,
  updatedAt
}: DetailsTileProps) => {
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isAiGeneratedTracksEnabled } = useFeatureFlag(
    FeatureFlags.AI_ATTRIBUTION
  )

  const styles = useStyles()
  const navigation = useNavigation()

  const currentUserId = useSelector(accountSelectors.getUserId)
  const isCurrentTrack = useSelector((state: CommonState) => {
    return track && track.track_id === getTrackId(state)
  })

  const tracks = useSelector((state: CommonState) =>
    getCollectionTracks(state, { id: contentId })
  )
  const trackAccessMap = useGatedContentAccessMap(tracks ?? [])
  const doesUserHaveAccessToAnyTrack = Object.values(trackAccessMap).some(
    ({ hasStreamAccess }) => hasStreamAccess
  )

  const isOwner = user?.user_id === currentUserId
  const isLongFormContent =
    track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
  const aiAttributionUserId = track?.ai_attribution_user_id
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  const isPlayingPreview = isPreviewing && isPlaying
  const isPlayingFullAccess = isPlaying && !isPreviewing
  const isUnpublishedScheduledRelease =
    track?.is_scheduled_release && track?.is_unlisted && releaseDate

  // Show play if user has access to the collection or any of its contents.
  // Show preview only if the user is the owner on a track screen.
  const shouldShowPlay =
    (isPlayable && hasStreamAccess) || doesUserHaveAccessToAnyTrack
  const shouldShowPreview =
    isUSDCPurchaseGated &&
    ((!isCollection && isOwner) || // own track
      (isCollection && !hasStreamAccess && !shouldShowPlay) || // premium collection
      (!isCollection && !hasStreamAccess)) && // premium track
    !!onPressPreview

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])

  const handlePressPlay = useCallback(() => {
    light()
    onPressPlay()
  }, [onPressPlay])

  const handlePressPreview = useCallback(() => {
    light()
    onPressPreview?.()
  }, [onPressPreview])

  const renderDogEar = () => {
    const dogEarType = getDogEarType({
      isOwner,
      streamConditions
    })
    return dogEarType ? <DogEar type={dogEarType} borderOffset={1} /> : null
  }

  const innerImageElement = renderImage({
    style: styles.coverArt
  })

  const imageElement = coSign ? (
    <CoSign size={Size.LARGE}>{innerImageElement}</CoSign>
  ) : (
    innerImageElement
  )

  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId: contentId, userId: currentUserId })
  )

  const playText =
    isNewPodcastControlsEnabled && playbackPositionInfo?.status
      ? playbackPositionInfo?.status === 'IN_PROGRESS' || isCurrentTrack
        ? messages.resume
        : messages.replay
      : messages.play

  const PlayIcon =
    isNewPodcastControlsEnabled &&
    playbackPositionInfo?.status === 'COMPLETED' &&
    !isCurrentTrack
      ? IconRepeatOff
      : IconPlay

  const PreviewButton = () => (
    <Button
      variant='tertiary'
      iconLeft={isPlayingPreview ? IconPause : PlayIcon}
      onPress={handlePressPreview}
      disabled={!isPlayable}
      fullWidth
    >
      {isPlayingPreview ? messages.pause : messages.preview}
    </Button>
  )

  const badges = [
    isAiGeneratedTracksEnabled && aiAttributionUserId ? (
      <DetailsTileAiAttribution userId={aiAttributionUserId} />
    ) : null,
    isUnpublishedScheduledRelease ? (
      <MusicBadge variant='accent' icon={IconCalendarMonth}>
        {messages.releases(releaseDate)}
      </MusicBadge>
    ) : isUnlisted ? (
      <MusicBadge icon={IconVisibilityHidden}>{messages.hidden}</MusicBadge>
    ) : null
  ].filter((badge) => badge !== null)

  const handlePressTag = useCallback(
    (tag: string) => {
      navigation.push('TagSearch', { query: tag })
    },
    [navigation]
  )

  const renderTags = () => {
    if (!track || (isUnlisted && !track.field_visibility?.tags)) {
      return null
    }

    const filteredTags = (track.tags || '').split(',').filter(Boolean)
    return filteredTags.length > 0 ? (
      <Flex
        direction='row'
        wrap='wrap'
        w='100%'
        justifyContent='flex-start'
        gap='s'
      >
        {filteredTags.map((tag) => (
          <Tag key={tag} onPress={() => handlePressTag(tag)}>
            {tag}
          </Tag>
        ))}
      </Flex>
    ) : null
  }

  if (isDeleted) {
    return (
      <DeletedTile
        imageElement={imageElement}
        title={title}
        user={user}
        headerText={headerText}
        handlePressArtistName={handlePressArtistName}
      />
    )
  }

  return (
    <Paper mb='2xl' style={{ overflow: 'hidden' }}>
      {renderDogEar()}
      <Flex p='l' gap='l' alignItems='center' w='100%'>
        <Text
          variant='label'
          size='m'
          strength='default'
          textTransform='uppercase'
          color='subdued'
        >
          {headerText}
        </Text>

        {badges.length > 0 ? (
          <Flex direction='row' gap='s'>
            {badges.map((badge) => badge)}
          </Flex>
        ) : null}
        {imageElement}
        <Flex gap='xs' alignItems='center'>
          <Text variant='heading' size='s'>
            {title}
          </Text>
          {user ? (
            <TouchableOpacity onPress={handlePressArtistName}>
              <Flex direction='row' gap='xs'>
                <Text variant='body' color='accent' size='l'>
                  {user.name}
                </Text>
                <UserBadges badgeSize={spacing.l} user={user} hideName />
              </Flex>
            </TouchableOpacity>
          ) : null}
        </Flex>
        {isLongFormContent && isNewPodcastControlsEnabled && track ? (
          <DetailsProgressInfo track={track} />
        ) : null}
        {shouldShowPlay ? (
          <Button
            iconLeft={isPlayingFullAccess ? IconPause : PlayIcon}
            onPress={handlePressPlay}
            disabled={!isPlayable}
            fullWidth
          >
            {isPlayingFullAccess ? messages.pause : playText}
          </Button>
        ) : null}
        {shouldShowPreview ? <PreviewButton /> : null}
        <DetailsTileActionButtons
          ddexApp={ddexApp}
          hasReposted={!!hasReposted}
          hasSaved={!!hasSaved}
          hideFavorite={hideFavorite}
          hideOverflow={hideOverflow}
          hideRepost={hideRepost}
          hideShare={hideShare}
          isOwner={isOwner}
          isCollection={isCollection}
          collectionId={contentId}
          isPublished={isPublished}
          onPressEdit={onPressEdit}
          onPressOverflow={onPressOverflow}
          onPressRepost={onPressRepost}
          onPressSave={onPressSave}
          onPressShare={onPressShare}
          onPressPublish={onPressPublish}
        />
      </Flex>
      <Flex
        p='l'
        gap='l'
        alignItems='center'
        borderTop='default'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {!hasStreamAccess && !isOwner && streamConditions && contentId ? (
          <DetailsTileNoAccess
            trackId={contentId}
            contentType={contentType}
            streamConditions={streamConditions}
          />
        ) : null}
        {(hasStreamAccess || isOwner) && streamConditions ? (
          <DetailsTileHasAccess
            streamConditions={streamConditions}
            isOwner={isOwner}
            trackArtist={user}
            contentType={contentType}
          />
        ) : null}
        {!isPublished ? null : (
          <DetailsTileStats
            favoriteCount={saveCount}
            hideFavoriteCount={hideFavoriteCount}
            hideRepostCount={hideRepostCount}
            onPressFavorites={onPressFavorites}
            onPressReposts={onPressReposts}
            repostCount={repostCount}
          />
        )}
        {description ? (
          <Box w='100%'>
            <UserGeneratedText
              source={descriptionLinkPressSource}
              variant='body'
              size='s'
            >
              {description}
            </UserGeneratedText>
          </Box>
        ) : null}
        <DetailsTileMetadata
          id={contentId}
          genre={track?.genre}
          mood={track?.mood}
        />
        <SecondaryStats
          isCollection={isCollection}
          playCount={playCount}
          duration={duration}
          trackCount={trackCount}
          releaseDate={releaseDate}
          updatedAt={updatedAt}
          hidePlayCount={hidePlayCount}
        />
        {renderTags()}
        <OfflineStatusRow contentId={contentId} isCollection={isCollection} />
      </Flex>
      <Divider />
      {renderBottomContent?.()}
    </Paper>
  )
}
