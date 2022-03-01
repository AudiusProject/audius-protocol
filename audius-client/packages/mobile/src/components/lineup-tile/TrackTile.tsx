import { useCallback } from 'react'

import {
  PlaybackSource,
  FavoriteSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
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
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { isEqual } from 'lodash'

import { LineupItemProps } from 'app/components/lineup-tile/types'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { LineupTile } from './LineupTile'

export const TrackTile = (props: LineupItemProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const track: Track = useSelectorWeb(
    state => getTrack(state, { uid }),
    isEqual
  )

  const user: User = useSelectorWeb(
    state => getUserFromTrack(state, { uid }),
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

  const {
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

  const { user_id } = user

  const isOwner = user_id === currentUserId

  const handlePress = useCallback(() => {
    togglePlay(lineupTileProps.uid, track_id, PlaybackSource.TRACK_TILE)
  }, [togglePlay, lineupTileProps.uid, track_id])

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
      OverflowAction.VIEW_ARTIST_PAGE
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
      duration={duration}
      hideShare={hideShare}
      hidePlays={hidePlays}
      id={track_id}
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
