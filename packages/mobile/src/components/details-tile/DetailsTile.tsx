import type { PropsWithChildren } from 'react'
import { useCallback } from 'react'

import { isContentUSDCPurchaseGated } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  playerSelectors,
  playbackPositionSelectors
} from '@audius/common/store'
import type { CommonState } from '@audius/common/store'
import {
  dayjs,
  squashNewLines,
  getDogEarType,
  formatSecondsAsText,
  formatDate,
  Genre,
  removeNullable,
  pluralize
} from '@audius/common/utils'
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
  Divider
} from '@audius/harmony-native'
import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { Hyperlink, DogEar } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { light } from 'app/haptics'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'

import { DetailsProgressInfo } from './DetailsProgressInfo'
import { DetailsTileActionButtons } from './DetailsTileActionButtons'
import { DetailsTileAiAttribution } from './DetailsTileAiAttribution'
import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'
import { DetailsTileStats } from './DetailsTileStats'
import { SecondaryStats } from './SecondaryStats'
import type { DetailsTileProps } from './types'

const { getTrackId } = playerSelectors
const { getTrackPosition } = playbackPositionSelectors

const messages = {
  play: 'play',
  pause: 'pause',
  resume: 'resume',
  replay: 'replay',
  preview: 'preview',
  trackCount: 'track',
  playCount: 'play',
  released: 'Released',
  updated: 'Updated'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 224,
    width: 224,
    alignSelf: 'center'
  },
  description: {
    ...typography.body,
    color: palette.neutralLight2,
    textAlign: 'left',
    width: '100%'
  },
  link: {
    color: palette.primary
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
  hideListenCount,
  hideOverflow,
  hideRepost,
  hideRepostCount,
  hideShare,
  isPlaying,
  isPreviewing,
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
  renderHeader,
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

  const isOwner = user?.user_id === currentUserId
  const isLongFormContent =
    track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
  const aiAttributionUserId = track?.ai_attribution_user_id
  const isUSDCPurchaseGated = isContentUSDCPurchaseGated(streamConditions)

  const isPlayingPreview = isPreviewing && isPlaying
  const isPlayingFullAccess = isPlaying && !isPreviewing
  const isUnpublishedScheduledRelease =
    track?.is_scheduled_release && track?.is_unlisted
  const showPreviewButton =
    isUSDCPurchaseGated && (isOwner || !hasStreamAccess) && onPressPreview

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
      streamConditions,
      isUnlisted: isUnlisted && !isUnpublishedScheduledRelease
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
    ) : null
    // TODO: trending badge
  ].filter((badge) => badge !== null)

  return (
    <Paper mb='xl'>
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
            <>{badges.map((badge) => badge)}</>
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
        {hasStreamAccess || isOwner ? (
          <Button
            iconLeft={isPlayingFullAccess ? IconPause : PlayIcon}
            onPress={handlePressPlay}
            disabled={!isPlayable}
            fullWidth
          >
            {isPlayingFullAccess ? messages.pause : playText}
          </Button>
        ) : null}
        {showPreviewButton ? <PreviewButton /> : null}
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
        {isUnpublishedScheduledRelease && track?.release_date ? (
          <Flex gap='xs' direction='row' alignItems='center'>
            <IconCalendarMonth color='accent' size='m' />
            <Text variant='body' color='accent' strength='strong' size='m'>
              Releases
              {' ' +
                moment(track.release_date).format('M/D/YY @ h:mm A ') +
                dayjs().format('z')}
            </Text>
          </Flex>
        ) : null}
      </Flex>
      <Flex
        p='l'
        gap='l'
        alignItems='center'
        borderTop='default'
        backgroundColor='surface1'
      >
        {!isPublished ? null : (
          <DetailsTileStats
            favoriteCount={saveCount}
            hideFavoriteCount={hideFavoriteCount}
            hideListenCount={hideListenCount}
            hideRepostCount={hideRepostCount}
            onPressFavorites={onPressFavorites}
            onPressReposts={onPressReposts}
            repostCount={repostCount}
          />
        )}
        {description ? (
          <Hyperlink
            source={descriptionLinkPressSource}
            style={styles.description}
            linkStyle={styles.link}
            text={squashNewLines(description) ?? ''}
          />
        ) : null}

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
          />
        ) : null}

        {/* TODO: Genre goes here */}
        <SecondaryStats
          playCount={playCount}
          duration={duration}
          trackCount={trackCount}
          releaseDate={releaseDate}
          updatedAt={updatedAt}
        />

        {/* TODO: tags go here for tracks */}
        {/* TODO: offline mode status */}
      </Flex>
      <Divider />
      {renderBottomContent?.()}
    </Paper>
  )
}
