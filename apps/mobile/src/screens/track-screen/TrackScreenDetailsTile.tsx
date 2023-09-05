import { useCallback } from 'react'

import type { UID, Track, User } from '@audius/common'
import {
  removeNullable,
  playerSelectors,
  FavoriteSource,
  RepostSource,
  ShareSource,
  Name,
  PlaybackSource,
  FavoriteType,
  SquareSizes,
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
  favoritesUserListActions
} from '@audius/common'
import { Image, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Tag, Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type { DetailsTileDetail } from 'app/components/details-tile/types'
import { useNavigation } from 'app/hooks/useNavigation'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { make, track as record } from 'app/services/analytics'
import type { SearchTrack, SearchUser } from 'app/store/search/types'
import { flexRowCentered, makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'
import { useThemeColors } from 'app/utils/theme'

import { TrackScreenDownloadButtons } from './TrackScreenDownloadButtons'
const { getPlaying, getTrackId } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { tracksActions } = trackPageLineupActions
const { getUserId } = accountSelectors

const messages = {
  track: 'track',
  remix: 'remix',
  hiddenTrack: 'hidden track'
}

type TrackScreenDetailsTileProps = {
  track: Track | SearchTrack
  user: User | SearchUser
  uid: UID
  isLineupLoading: boolean
}

const recordPlay = (id, play = true) => {
  record(
    make({
      eventName: play ? Name.PLAYBACK_PLAY : Name.PLAYBACK_PAUSE,
      id: String(id),
      source: PlaybackSource.TRACK_PAGE
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
    marginBottom: spacing(4)
  },

  hiddenTrackLabel: {
    marginTop: spacing(1),
    marginLeft: spacing(2),
    color: palette.accentOrange,
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase'
  },

  bottomContent: {
    marginHorizontal: spacing(3)
  }
}))

export const TrackScreenDetailsTile = ({
  track,
  user,
  uid,
  isLineupLoading
}: TrackScreenDetailsTileProps) => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { accentOrange } = useThemeColors()

  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()
  const playingId = useSelector(getTrackId)
  const isPlaying = useSelector(getPlaying)
  const isPlayingId = playingId === track.track_id

  const {
    _co_sign,
    _cover_art_sizes,
    created_at,
    credits_splits,
    description,
    duration,
    field_visibility,
    genre,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted,
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

  const imageUrl = useTrackCoverArt({
    id: track_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const isOwner = owner_id === currentUserId

  const remixParentTrackId = remix_of?.tracks?.[0]?.parent_track_id
  const isRemix = !!remixParentTrackId

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
      value: formatDate(release_date || created_at)
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

  const handlePressPlay = useCallback(() => {
    if (isLineupLoading) return

    if (isPlaying && isPlayingId) {
      dispatch(tracksActions.pause())
      recordPlay(track_id, false)
    } else if (!isPlayingId) {
      dispatch(tracksActions.play(uid))
      recordPlay(track_id)
    } else {
      dispatch(tracksActions.play())
      recordPlay(track_id)
    }
  }, [track_id, uid, isPlayingId, dispatch, isPlaying, isLineupLoading])

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

  const handlePressOverflow = () => {
    const overflowActions = [
      OverflowAction.ADD_TO_PLAYLIST,
      user.does_current_user_follow
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        overflowActions
      })
    )
  }

  const renderHiddenHeader = () => {
    return (
      <View style={styles.hiddenDetailsTileWrapper}>
        <IconHidden fill={accentOrange} />
        <Text style={styles.hiddenTrackLabel}>{messages.hiddenTrack}</Text>
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
        isOwner={isOwner}
        trackId={track_id}
        user={user}
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
      imageUrl={imageUrl}
      user={user}
      renderBottomContent={renderBottomContent}
      renderHeader={is_unlisted ? renderHiddenHeader : undefined}
      headerText={isRemix ? messages.remix : messages.track}
      hideFavorite={is_unlisted}
      hideRepost={is_unlisted}
      hideShare={is_unlisted && !field_visibility?.share}
      hideFavoriteCount={is_unlisted}
      hideListenCount={is_unlisted && !field_visibility?.play_count}
      hideRepostCount={is_unlisted}
      isPlaying={isPlaying && isPlayingId}
      onPressFavorites={handlePressFavorites}
      onPressOverflow={handlePressOverflow}
      onPressPlay={handlePressPlay}
      onPressRepost={handlePressRepost}
      onPressReposts={handlePressReposts}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      playCount={play_count}
      repostCount={repost_count}
      saveCount={save_count}
      title={title}
    />
  )
}
