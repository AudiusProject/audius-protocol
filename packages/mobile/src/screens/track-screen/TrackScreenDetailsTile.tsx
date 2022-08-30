import { useCallback } from 'react'

import type { UID, Track, User } from '@audius/common'
import {
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
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from 'audius-client/src/utils/route'
import { Image, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Tag, Text } from 'app/components/core'
import { DetailsTile } from 'app/components/details-tile'
import type { DetailsTileDetail } from 'app/components/details-tile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { make, track as record } from 'app/services/analytics'
import type { SearchTrack, SearchUser } from 'app/store/search/types'
import { flexRowCentered, makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'
import { getTagSearchRoute } from 'app/utils/routes'
import { useThemeColors } from 'app/utils/theme'

import { TrackScreenDownloadButtons } from './TrackScreenDownloadButtons'
const { getPlaying, getUid } = playerSelectors
const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const { repostTrack, saveTrack, undoRepostTrack, unsaveTrack } =
  tracksSocialActions
const { tracksActions } = trackPageLineupActions
const getUserId = accountSelectors.getUserId

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

  const currentUserId = useSelectorWeb(getUserId)
  const dispatchWeb = useDispatchWeb()
  const dispatch = useDispatch()
  const playingUid = useSelector(getUid)
  const isPlaying = useSelector(getPlaying)
  const isPlayingUid = playingUid === uid

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

    if (isPlaying && isPlayingUid) {
      dispatchWeb(tracksActions.pause())
      recordPlay(track_id, false)
    } else if (!isPlayingUid) {
      dispatchWeb(tracksActions.play(uid))
      recordPlay(track_id)
    } else {
      dispatchWeb(tracksActions.play())
      recordPlay(track_id)
    }
  }, [track_id, uid, isPlayingUid, dispatchWeb, isPlaying, isLineupLoading])

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(track_id, FavoriteType.TRACK))
    navigation.push({
      native: {
        screen: 'Favorited',
        params: { id: track_id, favoriteType: FavoriteType.TRACK }
      },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, track_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(track_id, RepostType.TRACK))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id: track_id, repostType: RepostType.TRACK }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, track_id, navigation])

  const handlePressTag = useCallback(
    (tag: string) => {
      const route = getTagSearchRoute(tag)
      navigation.push({
        native: {
          screen: 'TagSearch',
          params: { query: tag }
        },
        web: { route, fromPage: 'search' }
      })
    },
    [navigation]
  )

  const handlePressSave = () => {
    if (!isOwner) {
      if (has_current_user_saved) {
        dispatchWeb(unsaveTrack(track_id, FavoriteSource.TRACK_PAGE))
      } else {
        dispatchWeb(saveTrack(track_id, FavoriteSource.TRACK_PAGE))
      }
    }
  }

  const handlePressRepost = () => {
    if (!isOwner) {
      if (has_current_user_reposted) {
        dispatchWeb(undoRepostTrack(track_id, RepostSource.TRACK_PAGE))
      } else {
        dispatchWeb(repostTrack(track_id, RepostSource.TRACK_PAGE))
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
      isOwner || is_unlisted
        ? null
        : has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || is_unlisted
        ? null
        : has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      OverflowAction.ADD_TO_PLAYLIST,
      user.does_current_user_follow
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

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
      isPlaying={isPlaying && isPlayingUid}
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
