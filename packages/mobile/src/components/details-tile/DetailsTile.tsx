import { useCallback } from 'react'

import type { CommonState, Track } from '@audius/common'
import {
  FeatureFlags,
  Genre,
  usePremiumContentAccess,
  squashNewLines,
  accountSelectors,
  playerSelectors,
  playbackPositionSelectors
} from '@audius/common'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconPause from 'app/assets/images/iconPause.svg'
import IconPlay from 'app/assets/images/iconPlay.svg'
import IconRepeat from 'app/assets/images/iconRepeatOff.svg'
import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import {
  Button,
  Hyperlink,
  Tile,
  DogEar,
  DogEarType
} from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { light } from 'app/haptics'
import { useIsGatedContentEnabled } from 'app/hooks/useIsGatedContentEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { flexRowCentered, makeStyles } from 'app/styles'

import { DetailsProgressInfo } from './DetailsProgressInfo'
import { DetailsTileActionButtons } from './DetailsTileActionButtons'
import { DetailsTileAiAttribution } from './DetailsTileAiAttribution'
import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'
import { DetailsTileStats } from './DetailsTileStats'
import type { DetailsTileProps } from './types'

const { getTrackId } = playerSelectors
const { getTrackPosition } = playbackPositionSelectors

const messages = {
  play: 'play',
  pause: 'pause',
  resume: 'resume',
  replay: 'replay'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    marginBottom: spacing(6)
  },
  tileContent: {
    paddingBottom: spacing(1)
  },
  topContent: {
    paddingHorizontal: spacing(2),
    paddingTop: spacing(2),
    width: '100%'
  },
  topContentBody: {
    paddingHorizontal: spacing(2)
  },

  typeLabel: {
    marginTop: spacing(2),
    marginBottom: spacing(2),
    height: 18,
    color: palette.neutralLight4,
    fontSize: typography.fontSize.xs,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase'
  },

  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 195,
    width: 195,
    marginBottom: spacing(6),
    alignSelf: 'center'
  },

  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing(4)
  },

  artistContainer: {
    ...flexRowCentered(),
    marginBottom: spacing(4),
    alignSelf: 'center'
  },

  artist: {
    color: palette.secondary,
    fontSize: 18
  },

  badge: {
    marginLeft: spacing(1)
  },

  descriptionContainer: {
    width: '100%'
  },

  description: {
    ...typography.body,
    color: palette.neutralLight2,
    textAlign: 'left',
    width: '100%',
    marginBottom: spacing(6)
  },

  buttonSection: {
    width: '100%',
    marginBottom: spacing(3)
  },

  playButtonText: {
    textTransform: 'uppercase'
  },

  playButtonIcon: {
    height: 20,
    width: 20
  },

  infoSection: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: '100%',
    paddingTop: spacing(4)
  },

  noStats: {
    borderWidth: 0
  },

  infoFact: {
    ...flexRowCentered(),
    flexBasis: '50%',
    marginBottom: spacing(4)
  },

  infoLabel: {
    ...flexRowCentered(),
    color: palette.neutralLight5,
    fontSize: 14,
    lineHeight: 14,
    textTransform: 'uppercase',
    marginRight: spacing(2)
  },

  infoValue: {
    lineHeight: 14,
    flexShrink: 1,
    color: palette.neutral,
    fontSize: 14
  },

  infoIcon: {
    marginTop: -spacing(1)
  },

  link: {
    color: palette.primary
  }
}))

/**
 * The details shown at the top of the Track Screen and Collection Screen
 */
export const DetailsTile = ({
  collectionId,
  coSign,
  description,
  descriptionLinkPressSource,
  details,
  hasReposted,
  hasSaved,
  hideFavorite,
  hideFavoriteCount,
  hideListenCount,
  hideOverflow,
  hideRepost,
  hideRepostCount,
  hideShare,
  isPlaying,
  isPlayable = true,
  isPlaylist = false,
  isPublished = true,
  onPressEdit,
  onPressFavorites,
  onPressOverflow,
  onPressPlay,
  onPressPublish,
  onPressRepost,
  onPressReposts,
  onPressSave,
  onPressShare,
  playCount,
  renderBottomContent,
  renderHeader,
  renderImage,
  repostCount,
  saveCount,
  headerText,
  title,
  user,
  track
}: DetailsTileProps) => {
  const isGatedContentEnabled = useIsGatedContentEnabled()
  const { doesUserHaveAccess } = usePremiumContentAccess(
    track ? (track as unknown as Track) : null
  )
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isAiGeneratedTracksEnabled } = useFeatureFlag(
    FeatureFlags.AI_ATTRIBUTION
  )
  const { track_id: trackId, premium_conditions: premiumConditions } =
    track ?? {}

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

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])

  const detailLabels = details.filter(
    ({ isHidden, value }) => !isHidden && !!value
  )

  const handlePressPlay = useCallback(() => {
    light()
    onPressPlay()
  }, [onPressPlay])

  const renderDogEar = () => {
    const showPremiumDogEar =
      isGatedContentEnabled &&
      premiumConditions &&
      (isOwner || !doesUserHaveAccess)

    const dogEarType = showPremiumDogEar
      ? isOwner
        ? premiumConditions.nft_collection
          ? DogEarType.COLLECTIBLE_GATED
          : DogEarType.SPECIAL_ACCESS
        : DogEarType.LOCKED
      : null

    if (showPremiumDogEar && dogEarType) {
      return <DogEar type={dogEarType} />
    }
    return null
  }

  const renderDetailLabels = () => {
    return detailLabels.map((infoFact) => {
      return (
        <View key={infoFact.label} style={styles.infoFact}>
          <Text style={styles.infoLabel} weight='bold'>
            {infoFact.label}
          </Text>
          <Text
            style={[styles.infoValue, infoFact.valueStyle]}
            weight='demiBold'
          >
            {infoFact.value}
          </Text>
          <View style={styles.infoIcon}>{infoFact.icon}</View>
        </View>
      )
    })
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
    getTrackPosition(state, { trackId, userId: currentUserId })
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
      ? IconRepeat
      : IconPlay

  return (
    <Tile styles={{ root: styles.root, content: styles.tileContent }}>
      <View style={styles.topContent}>
        {renderDogEar()}
        {renderHeader ? (
          renderHeader()
        ) : (
          <Text style={styles.typeLabel} weight='medium'>
            {headerText}
          </Text>
        )}
        <View style={styles.topContentBody}>
          {imageElement}
          <Text style={styles.title} weight='bold'>
            {title}
          </Text>
          {user ? (
            <TouchableOpacity onPress={handlePressArtistName}>
              <View style={styles.artistContainer}>
                <Text style={styles.artist}>{user.name}</Text>
                <UserBadges
                  style={styles.badge}
                  badgeSize={16}
                  user={user}
                  hideName
                />
              </View>
            </TouchableOpacity>
          ) : null}
          {isLongFormContent && isNewPodcastControlsEnabled ? (
            <DetailsProgressInfo track={track} />
          ) : null}
          <View style={styles.buttonSection}>
            {isGatedContentEnabled &&
              !doesUserHaveAccess &&
              premiumConditions &&
              trackId && (
                <DetailsTileNoAccess
                  trackId={trackId}
                  premiumConditions={premiumConditions}
                />
              )}
            {!isGatedContentEnabled || doesUserHaveAccess ? (
              <Button
                styles={{
                  text: styles.playButtonText,
                  icon: styles.playButtonIcon
                }}
                title={isPlaying ? messages.pause : playText}
                size='large'
                iconPosition='left'
                icon={isPlaying ? IconPause : PlayIcon}
                onPress={handlePressPlay}
                disabled={!isPlayable}
                fullWidth
              />
            ) : null}
            <DetailsTileActionButtons
              hasReposted={!!hasReposted}
              hasSaved={!!hasSaved}
              hideFavorite={hideFavorite}
              hideOverflow={hideOverflow}
              hideRepost={hideRepost}
              hideShare={hideShare}
              isOwner={isOwner}
              isPlaylist={isPlaylist}
              collectionId={collectionId}
              isPublished={isPublished}
              onPressEdit={onPressEdit}
              onPressOverflow={onPressOverflow}
              onPressRepost={onPressRepost}
              onPressSave={onPressSave}
              onPressShare={onPressShare}
              onPressPublish={onPressPublish}
            />
          </View>
          {isAiGeneratedTracksEnabled && aiAttributionUserId ? (
            <DetailsTileAiAttribution userId={aiAttributionUserId} />
          ) : null}
          {isGatedContentEnabled && doesUserHaveAccess && premiumConditions && (
            <DetailsTileHasAccess
              premiumConditions={premiumConditions}
              isOwner={isOwner}
            />
          )}
          {!isPublished ? null : (
            <DetailsTileStats
              favoriteCount={saveCount}
              hideFavoriteCount={hideFavoriteCount}
              hideListenCount={hideListenCount}
              hideRepostCount={hideRepostCount}
              onPressFavorites={onPressFavorites}
              onPressReposts={onPressReposts}
              playCount={playCount}
              repostCount={repostCount}
            />
          )}
          <View style={styles.descriptionContainer}>
            {description ? (
              <Hyperlink
                source={descriptionLinkPressSource}
                style={styles.description}
                linkStyle={styles.link}
                text={squashNewLines(description)}
              />
            ) : null}
          </View>
          <View
            style={[
              styles.infoSection,
              hideFavoriteCount &&
                hideListenCount &&
                hideRepostCount &&
                styles.noStats
            ]}
          >
            {renderDetailLabels()}
          </View>
        </View>
      </View>
      {renderBottomContent?.()}
    </Tile>
  )
}
