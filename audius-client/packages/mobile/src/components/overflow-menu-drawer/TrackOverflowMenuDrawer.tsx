import React from 'react'

import {
  FavoriteSource,
  FollowSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { ID } from 'audius-client/src/common/models/Identifiers'
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
import { requestOpen as openTikTokModal } from 'audius-client/src/common/store/ui/share-sound-to-tiktok-modal/slice'
import { profilePage } from 'audius-client/src/utils/route'
import { push } from 'connected-react-router'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const TrackOverflowMenuDrawer = ({ render }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID

  const { owner_id, title, permalink } = useSelectorWeb((state: CommonState) =>
    getTrack(state, { id })
  )

  const { handle } = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: owner_id })
  )

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
    [OverflowAction.SHARE_TO_TIKTOK]: () =>
      dispatchWeb(openTikTokModal({ id })),
    [OverflowAction.ADD_TO_PLAYLIST]: () =>
      dispatchWeb(openAddToPlaylistModal(id, title)),
    [OverflowAction.VIEW_TRACK_PAGE]: () =>
      permalink === undefined
        ? console.error(`Permalink missing for track ${id}`)
        : dispatchWeb(push(permalink)),
    [OverflowAction.VIEW_ARTIST_PAGE]: () =>
      dispatchWeb(push(profilePage(handle))),
    [OverflowAction.FOLLOW_ARTIST]: () =>
      dispatchWeb(followUser(owner_id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW_ARTIST]: () =>
      dispatchWeb(unfollowUser(owner_id, FollowSource.OVERFLOW))
  }

  return render(callbacks)
}

export default TrackOverflowMenuDrawer
