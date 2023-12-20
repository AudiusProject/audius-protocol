import { useCallback } from 'react'

import {
  Genre,
  SquareSizes,
  removeNullable,
  playerSelectors,
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource,
  FavoriteType,
  getCanonicalName,
  formatSeconds,
  formatDate,
  accountSelectors,
  trackPageLineupActions,
  tracksSocialActions,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions,
  shareModalUIActions,
  RepostType,
  repostsUserListActions,
  favoritesUserListActions,
  reachabilitySelectors,
  useGatedContentAccess,
  playbackPositionSelectors,
  FeatureFlags,
  isContentUSDCPurchaseGated,
  isContentCollectibleGated,
  queueSelectors
} from '@audius/common'
import type { UID, User, SearchTrack, SearchUser, Track } from '@audius/common'
import moment from 'moment'
import { Image, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import IconCart from 'app/assets/images/iconCart.svg'
import IconCollectible from 'app/assets/images/iconCollectible.svg'
import IconHidden from 'app/assets/images/iconHidden.svg'
import IconRobot from 'app/assets/images/iconRobot.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import { Tag, Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type { DetailsTileDetail } from 'app/components/details-tile/types'
import type { ImageProps } from 'app/components/image/FastImage'
import { TrackImage } from 'app/components/image/TrackImage'
import { TrackDownloadStatusIndicator } from 'app/components/offline-downloads/TrackDownloadStatusIndicator'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { make, track as record } from 'app/services/analytics'
import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { moodMap } from 'app/utils/moods'
import { useThemeColors } from 'app/utils/theme'

import { TrackScreenDownloadButtons } from './TrackScreenDownloadButtons'
const { getPlaying, getTrackId, getPreviewing } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { tracksActions } = trackPageLineupActions
const { getUserId } = accountSelectors
const { getIsReachable } = reachabilitySelectors
const { getTrackPosition } = playbackPositionSelectors
const { makeGetCurrent } = queueSelectors
const getCurrentQueueItem = makeGetCurrent()

const messages = {
  track: 'track',
  podcast: 'podcast',
  remix: 'remix',
  hiddenTrack: 'hidden track',
  collectibleGated: 'collectible gated',
  specialAccess: 'special access',
  usdcPurchase: 'premium track',
  generatedWithAi: 'generated with ai',
  trackDeleted: 'track [deleted by artist]'
}

type TrackScreenDetailsTileProps = {
  track: Track | SearchTrack
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true, isPreview = false) => {
  record(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.TRACK_PAGE,
      isPreview
    })
  )
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  tags: {
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight7,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: spacing(4)
  },

  moodEmoji: {
    marginLeft: spacing(1),
    width: 20,
    height: 20
  },

  hiddenDetailsTileWrapper: {
    ...flexRowCentered(),
    justifyContent: 'center',
    marginVertical: spacing(4)
  },

  hiddenTrackLabel: {
    marginTop: spacing(1),
    marginLeft: spacing(2),
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: palette.neutralLight4
  },

  bottomContent: {
    marginHorizontal: spacing(3)
  },

  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(4)
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    marginTop: spacing(4),
    marginBottom: spacing(4),
    letterSpacing: 3,
    lineHeight: 14,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  headerView: {
    ...flexRowCentered(),
    marginTop: spacing(2),
    marginBottom: spacing(4)
  },
  gatedHeaderText: {
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.small,
    color: palette.neutralLight4
  },
  gatedIcon: {
    marginRight: spacing(2.5),
    fill: palette.accentBlue
  },
  downloadStatusIndicator: {
    marginRight: spacing(2)
  },
  aiAttributedHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: spacing(2),
    paddingVertical: spacing(2.5),
    borderRadius: spacing(1.5),
    marginBottom: spacing(4)
  },
  aiAttributedText: {
    textTransform: 'uppercase',
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.small * 1.3,
    letterSpacing: 0.7,
    color: palette.white
  }
}))

export const TrackScreenDetailsTile = ({
  track,
  user,
  uid,
  isLineupLoading
}: TrackScreenDetailsTileProps) => {
  const { doesUserHaveAccess } = useGatedContentAccess(track as Track) // track is of type Track | SearchTrack but we only care about some of their common fields, maybe worth refactoring later
  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  const { isEnabled: isAiGeneratedTracksEnabled } = useFeatureFlag(
    FeatureFlags.AI_ATTRIBUTION
  )
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )
  const styles = useStyles()
  const navigation = useNavigation()
  const { white, aiPrimary, aiSecondary, neutralLight4 } = useThemeColors()

  const isOfflineEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)
  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()
  const playingId = useSelector(getTrackId)
  const isPlaying = useSelector(getPlaying)
  const isPreviewing = useSelector(getPreviewing)
  const isPlayingId = playingId === track.track_id

  const {
    _co_sign,
    created_at,
    credits_splits,
    description,
    duration,
    field_visibility,
    genre,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted,
    is_delete,
    is_stream_gated: isStreamGated,
    mood,
    owner_id,
    play_count,
    release_date,
    remix_of,
    repost_count,
    save_count,
    tags,
    title,
    track_id
  } = track

  const isOwner = owner_id === currentUserId
  const hideFavorite = is_unlisted || !doesUserHaveAccess
  const hideRepost = is_unlisted || !isReachable || !doesUserHaveAccess

  const remixParentTrackId = remix_of?.tracks?.[0]?.parent_track_id
  const isRemix = !!remixParentTrackId
  const isScheduledRelease = release_date
    ? moment(release_date).isAfter(moment.now())
    : false

  const filteredTags = (tags || '').split(',').filter(Boolean)

  const details: DetailsTileDetail[] = [
    { label: 'Duration', value: formatSeconds(duration) },
    {
      isHidden: is_unlisted && !field_visibility?.genre,
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      isHidden: is_unlisted,
      label: 'Released',
      value: release_date ? formatDate(release_date) : formatDate(created_at)
    },
    {
      icon:
        mood && mood in moodMap ? (
          <Image source={moodMap[mood]} style={styles.moodEmoji} />
        ) : null,
      isHidden: is_unlisted && !field_visibility?.mood,
      label: 'Mood',
      value: mood,
      valueStyle: { flexShrink: 0, marginTop: -2 }
    },
    { label: 'Credit', value: credits_splits }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  const renderImage = useCallback(
    (props: ImageProps) => (
      <TrackImage track={track} size={SquareSizes.SIZE_480_BY_480} {...props} />
    ),
    [track]
  )

  const currentQueueItem = useSelector(getCurrentQueueItem)
  const play = useCallback(
    ({ isPreview = false } = {}) => {
      if (isLineupLoading) return

      if (isPlaying && isPreviewing === isPreview) {
        dispatch(tracksActions.pause())
        recordPlay(track_id, false, true)
      } else if (
        currentQueueItem.uid !== uid &&
        currentQueueItem.track &&
        currentQueueItem.track.track_id === track_id
      ) {
        dispatch(tracksActions.play())
        recordPlay(track_id)
      } else {
        dispatch(tracksActions.play(uid, { isPreview }))
        recordPlay(track_id, true, true)
      }
    },
    [
      track_id,
      currentQueueItem,
      uid,
      dispatch,
      isPlaying,
      isPreviewing,
      isLineupLoading
    ]
  )

  const handlePressPlay = useCallback(() => play(), [play])
  const handlePressPreview = useCallback(
    () => play({ isPreview: true }),
    [play]
  )

  const handlePressFavorites = useCallback(() => {
    dispatch(setFavorite(track_id, FavoriteType.TRACK))
    navigation.push('Favorited', {
      id: track_id,
      favoriteType: FavoriteType.TRACK
    })
  }, [dispatch, track_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatch(setRepost(track_id, RepostType.TRACK))
    navigation.push('Reposts', { id: track_id, repostType: RepostType.TRACK })
  }, [dispatch, track_id, navigation])

  const handlePressTag = useCallback(
    (tag: string) => {
      navigation.push('TagSearch', { query: tag })
    },
    [navigation]
  )

  const handlePressSave = () => {
    if (!isOwner) {
      if (has_current_user_saved) {
        dispatch(unsaveTrack(track_id, FavoriteSource.TRACK_PAGE))
      } else {
        dispatch(saveTrack(track_id, FavoriteSource.TRACK_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (has_current_user_reposted) {
        dispatch(undoRepostTrack(track_id, RepostSource.TRACK_PAGE))
      } else {
        dispatch(repostTrack(track_id, RepostSource.TRACK_PAGE))
      }
    }
  }

  const handlePressShare = () => {
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId: track_id,
        source: ShareSource.PAGE
      })
    )
  }

  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId: track_id, userId: currentUserId })
  )
  const handlePressOverflow = () => {
    const isLongFormContent =
      genre === Genre.PODCASTS || genre === Genre.AUDIOBOOKS
    const addToAlbumAction =
      isEditAlbumsEnabled && isOwner ? OverflowAction.ADD_TO_ALBUM : null
    const addToPlaylistAction = !isStreamGated
      ? OverflowAction.ADD_TO_PLAYLIST
      : null
    const overflowActions = [
      addToAlbumAction,
      addToPlaylistAction,
      isOwner
        ? null
        : user.does_current_user_follow
          ? OverflowAction.UNFOLLOW_ARTIST
          : OverflowAction.FOLLOW_ARTIST,
      isNewPodcastControlsEnabled && isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      OverflowAction.VIEW_ARTIST_PAGE,
      isOwner ? OverflowAction.EDIT_TRACK : null,
      isOwner && track?.is_scheduled_release && track?.is_unlisted
        ? OverflowAction.RELEASE_NOW
        : null,
      isOwner ? OverflowAction.DELETE_TRACK : null
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        overflowActions
      })
    )
  }

  const downloadStatus = useSelector(getTrackOfflineDownloadStatus(track_id))
  const getDownloadTextColor = () => {
    if (
      downloadStatus === OfflineDownloadStatus.SUCCESS ||
      downloadStatus === OfflineDownloadStatus.LOADING
    ) {
      return 'secondary'
    }
    return 'neutralLight4'
  }

  const renderHeaderText = () => {
    if (isStreamGated && track.stream_conditions != null) {
      let IconComponent = IconSpecialAccess
      let text = messages.specialAccess
      if (isContentCollectibleGated(track.stream_conditions)) {
        IconComponent = IconCollectible
        text = messages.collectibleGated
      } else if (isContentUSDCPurchaseGated(track.stream_conditions)) {
        IconComponent = IconCart
        text = messages.usdcPurchase
      }

      return (
        <View style={styles.headerView}>
          <IconComponent
            style={styles.gatedIcon}
            fill={neutralLight4}
            width={spacing(4.5)}
            height={spacing(4.5)}
          />
          <Text style={styles.gatedHeaderText}>{text}</Text>
        </View>
      )
    }

    const isPodcast = genre === Genre.PODCASTS

    return (
      <Text
        style={styles.headerText}
        color={getDownloadTextColor()}
        weight='medium'
        fontSize='xs'
      >
        {isRemix
          ? messages.remix
          : isNewPodcastControlsEnabled && isPodcast
            ? messages.podcast
            : messages.track}
      </Text>
    )
  }

  const renderAiHeader = () => {
    if (!isAiGeneratedTracksEnabled || !track.ai_attribution_user_id) {
      return null
    }

    return (
      <LinearGradient
        style={styles.aiAttributedHeader}
        colors={[aiPrimary, aiSecondary]}
        useAngle
        angle={180}
      >
        <IconRobot fill={white} />
        <Text style={styles.aiAttributedText}>{messages.generatedWithAi}</Text>
      </LinearGradient>
    )
  }

  const renderHeader = () => {
    if (is_delete) {
      return (
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Text
              style={styles.headerText}
              weight='medium'
              fontSize='xs'
              color={getDownloadTextColor()}
            >
              {messages.trackDeleted}
            </Text>
          </View>
        </View>
      )
    }

    return is_unlisted && !isScheduledRelease ? (
      <View style={styles.hiddenDetailsTileWrapper}>
        <IconHidden fill={neutralLight4} />
        <Text style={styles.hiddenTrackLabel}>{messages.hiddenTrack}</Text>
      </View>
    ) : (
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TrackDownloadStatusIndicator
            style={styles.downloadStatusIndicator}
            size={16}
            trackId={track_id}
          />
          {renderHeaderText()}
        </View>
        {renderAiHeader()}
      </View>
    )
  }

  const renderTags = () => {
    if (is_unlisted && !field_visibility?.tags) {
      return null
    }

    return filteredTags.length > 0 ? (
      <View style={styles.tags}>
        {filteredTags.map((tag) => (
          <Tag key={tag} onPress={() => handlePressTag(tag)}>
            {tag}
          </Tag>
        ))}
      </View>
    ) : null
  }

  const renderDownloadButtons = () => {
    return (
      <TrackScreenDownloadButtons
        following={user.does_current_user_follow}
        doesUserHaveAccess={doesUserHaveAccess}
        isOwner={isOwner}
        trackId={track_id}
      />
    )
  }

  const renderBottomContent = () => {
    return (
      <View style={styles.bottomContent}>
        {renderDownloadButtons()}
        {renderTags()}
      </View>
    )
  }

  return (
    <DetailsTile
      descriptionLinkPressSource='track page'
      coSign={_co_sign}
      description={description ?? undefined}
      details={details}
      hasReposted={has_current_user_reposted}
      hasSaved={has_current_user_saved}
      user={user}
      renderBottomContent={renderBottomContent}
      renderHeader={is_unlisted || isOfflineEnabled ? renderHeader : undefined}
      headerText={isRemix ? messages.remix : messages.track}
      hideFavorite={hideFavorite}
      hideRepost={hideRepost}
      hideShare={(is_unlisted && !isOwner) || !field_visibility?.share}
      hideOverflow={!isReachable}
      hideFavoriteCount={is_unlisted}
      hideListenCount={
        (!isOwner && is_unlisted && !field_visibility?.play_count) ||
        isStreamGated
      }
      hideRepostCount={is_unlisted}
      isPlaying={isPlaying && isPlayingId}
      isPreviewing={isPreviewing}
      isUnlisted={is_unlisted}
      onPressFavorites={handlePressFavorites}
      onPressOverflow={handlePressOverflow}
      onPressPlay={handlePressPlay}
      onPressPreview={handlePressPreview}
      onPressRepost={handlePressRepost}
      onPressReposts={handlePressReposts}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      playCount={play_count}
      renderImage={renderImage}
      repostCount={repost_count}
      saveCount={save_count}
      title={title}
      track={track}
    />
  )
}
