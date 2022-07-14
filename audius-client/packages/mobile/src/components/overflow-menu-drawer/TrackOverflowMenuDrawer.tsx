import type { ID } from '@audius/common'
import {
  FavoriteSource,
  FollowSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { CommonState } from 'audius-client/src/common/store'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
// Importing directly from audius-client for now, this will be removed
// when the profile page is implemented in RN
import {
  repostTrack,
  undoRepostTrack,
  saveTrack,
  unsaveTrack,
  shareTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import {
  followUser,
  unfollowUser
} from 'audius-client/src/common/store/social/users/actions'
import { requestOpen as openAddToPlaylistModal } from 'audius-client/src/common/store/ui/add-to-playlist/actions'
import { getMobileOverflowModal } from 'audius-client/src/common/store/ui/mobile-overflow-menu/selectors'
import {
  OverflowAction,
  OverflowActionCallbacks
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { profilePage } from 'audius-client/src/utils/route'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const TrackOverflowMenuDrawer = ({ render }: Props) => {
  const { onClose: closeNowPlayingDrawer } = useDrawer('NowPlaying')
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const track = useSelectorWeb((state: CommonState) => getTrack(state, { id }))

  const user = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: track?.owner_id })
  )

  if (!track || !user) {
    return null
  }
  const { owner_id, title, permalink } = track
  const { handle } = user

  if (!id || !owner_id || !handle || !title) {
    return null
  }

  const callbacks = {
    [OverflowAction.REPOST]: () =>
      dispatchWeb(repostTrack(id, RepostSource.OVERFLOW)),
    [OverflowAction.UNREPOST]: () =>
      dispatchWeb(undoRepostTrack(id, RepostSource.OVERFLOW)),
    [OverflowAction.FAVORITE]: () =>
      dispatchWeb(saveTrack(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.UNFAVORITE]: () =>
      dispatchWeb(unsaveTrack(id, FavoriteSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareTrack(id, ShareSource.OVERFLOW)),
    [OverflowAction.ADD_TO_PLAYLIST]: () =>
      dispatchWeb(openAddToPlaylistModal(id, title)),
    [OverflowAction.VIEW_TRACK_PAGE]: () => {
      closeNowPlayingDrawer()
      navigation.navigate({
        native: { screen: 'Track', params: { id } },
        web: { route: permalink }
      })
    },
    [OverflowAction.VIEW_ARTIST_PAGE]: () => {
      closeNowPlayingDrawer()
      navigation.navigate({
        native: { screen: 'Profile', params: { handle } },
        web: { route: profilePage(handle) }
      })
    },
    [OverflowAction.FOLLOW_ARTIST]: () =>
      dispatchWeb(followUser(owner_id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW_ARTIST]: () =>
      dispatchWeb(unfollowUser(owner_id, FollowSource.OVERFLOW))
  }

  return render(callbacks)
}

export default TrackOverflowMenuDrawer
