import { useCallback } from 'react'

import type { Track, User } from '@audius/common'
import {
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  ShareSource,
  FavoriteType,
  SquareSizes
} from '@audius/common'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'audius-client/src/common/store/cache/users/selectors'
import {
  repostTrack,
  saveTrack,
  undoRepostTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import {
  OverflowAction,
  OverflowSource
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'audius-client/src/common/store/ui/share-modal/slice'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { useSelector } from 'react-redux'

import type { LineupItemProps } from 'app/components/lineup-tile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import type { AppState } from 'app/store'
import { getPlayingUid } from 'app/store/audio/selectors'

import { LineupTile } from './LineupTile'

export const TrackTile = (props: LineupItemProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const track = useSelectorWeb((state) => getTrack(state, { uid }), isEqual)

  const user = useSelectorWeb(
    (state) => getUserFromTrack(state, { uid }),
    isEqual
  )

  if (!track || !user) {
    console.warn('Track or user missing for TrackTile, preventing render')
    return null
  }

  if (track.is_delete || user?.is_deactivated) {
    return null
  }

  return <TrackTileComponent {...props} track={track} user={user} />
}

type TrackTileProps = LineupItemProps & {
  track: Track
  user: User
}

const TrackTileComponent = ({
  togglePlay,
  track,
  user,
  ...lineupTileProps
}: TrackTileProps) => {
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const currentUserId = useSelectorWeb(getUserId)
  const isPlayingUid = useSelector(
    (state: AppState) => getPlayingUid(state) === lineupTileProps.uid
  )

  const {
    _cover_art_sizes,
    duration,
    field_visibility,
    is_unlisted,
    has_current_user_reposted,
    has_current_user_saved,
    permalink,
    play_count,
    title,
    track_id
  } = track

  const currentScreen = navigation.getState().history?.[0]
  // @ts-expect-error -- history returning unknown[]
  const isOnArtistsTracksTab = currentScreen?.key.includes('Tracks')

  const { user_id } = user

  const isOwner = user_id === currentUserId

  const imageUrl = useTrackCoverArt({
    id: track_id,
    sizes: _cover_art_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const handlePress = useCallback(
    ({ isPlaying }) => {
      togglePlay({
        uid: lineupTileProps.uid,
        id: track_id,
        source: PlaybackSource.TRACK_TILE,
        isPlaying,
        isPlayingUid
      })
    },
    [togglePlay, lineupTileProps.uid, track_id, isPlayingUid]
  )

  const handlePressTitle = useCallback(() => {
    navigation.push({
      native: { screen: 'Track', params: { id: track_id } },
      web: { route: permalink }
    })
  }, [navigation, permalink, track_id])

  const handlePressOverflow = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    const overflowActions = [
      !isOwner
        ? has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      !isOwner
        ? has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      OverflowAction.SHARE,
      OverflowAction.ADD_TO_PLAYLIST,
      OverflowAction.VIEW_TRACK_PAGE,
      isOnArtistsTracksTab ? null : OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        overflowActions
      })
    )
  }, [
    track_id,
    dispatchWeb,
    has_current_user_reposted,
    has_current_user_saved,
    isOwner
  ])

  const handlePressShare = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    dispatchWeb(
      requestOpenShareModal({
        type: 'track',
        trackId: track_id,
        source: ShareSource.TILE
      })
    )
  }, [dispatchWeb, track_id])

  const handlePressSave = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    if (has_current_user_saved) {
      dispatchWeb(unsaveTrack(track_id, FavoriteSource.TILE))
    } else {
      dispatchWeb(saveTrack(track_id, FavoriteSource.TILE))
    }
  }, [track_id, dispatchWeb, has_current_user_saved])

  const handlePressRepost = useCallback(() => {
    if (track_id === undefined) {
      return
    }
    if (has_current_user_reposted) {
      dispatchWeb(undoRepostTrack(track_id, RepostSource.TILE))
    } else {
      dispatchWeb(repostTrack(track_id, RepostSource.TILE))
    }
  }, [track_id, dispatchWeb, has_current_user_reposted])

  const hideShare = field_visibility?.share === false
  const hidePlays = field_visibility?.play_count === false

  return (
    <LineupTile
      {...lineupTileProps}
      isPlayingUid={isPlayingUid}
      duration={duration}
      favoriteType={FavoriteType.TRACK}
      repostType={RepostType.TRACK}
      hideShare={hideShare}
      hidePlays={hidePlays}
      id={track_id}
      imageUrl={imageUrl}
      isUnlisted={is_unlisted}
      onPress={handlePress}
      onPressOverflow={handlePressOverflow}
      onPressRepost={handlePressRepost}
      onPressSave={handlePressSave}
      onPressShare={handlePressShare}
      onPressTitle={handlePressTitle}
      playCount={play_count}
      title={title}
      item={track}
      user={user}
    />
  )
}
