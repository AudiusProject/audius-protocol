import {
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUISelectors
} from '@audius/common'

import ActionDrawer from 'app/components/action-drawer'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import CollectionOverflowMenuDrawer from './CollectionOverflowMenuDrawer'
import ProfileOverflowMenuDrawer from './ProfileOverflowMenuDrawer'
import TrackOverflowMenuDrawer from './TrackOverflowMenuDrawer'
const { getMobileOverflowModal } = mobileOverflowMenuUISelectors

const rowMessageMap = {
  [OverflowAction.REPOST]: 'Repost',
  [OverflowAction.UNREPOST]: 'Unrepost',
  [OverflowAction.FAVORITE]: 'Favorite',
  [OverflowAction.UNFAVORITE]: 'Unfavorite',
  [OverflowAction.SHARE]: 'Share',
  [OverflowAction.ADD_TO_PLAYLIST]: 'Add To Playlist',
  [OverflowAction.EDIT_PLAYLIST]: 'Edit Playlist',
  [OverflowAction.DELETE_PLAYLIST]: 'Delete Playlist',
  [OverflowAction.PUBLISH_PLAYLIST]: 'Publish Playlist',
  [OverflowAction.VIEW_TRACK_PAGE]: 'View Track Page',
  [OverflowAction.VIEW_ARTIST_PAGE]: 'View Artist Page',
  [OverflowAction.VIEW_PLAYLIST_PAGE]: 'View Playlist Page',
  [OverflowAction.VIEW_ALBUM_PAGE]: 'View Album Page',
  [OverflowAction.UNSUBSCRIBER_USER]: 'Unsubscribe',
  [OverflowAction.FOLLOW_ARTIST]: 'Follow Artist',
  [OverflowAction.UNFOLLOW_ARTIST]: 'Unfollow Artist',
  [OverflowAction.FOLLOW]: 'Follow',
  [OverflowAction.UNFOLLOW]: 'Unfollow'
}

export const OverflowMenuDrawer = () => {
  const overflowMenu = useSelectorWeb(getMobileOverflowModal)

  if (!overflowMenu?.id) {
    return <></>
  }

  const { source, overflowActions } = overflowMenu

  const OverflowDrawerComponent =
    {
      [OverflowSource.TRACKS]: TrackOverflowMenuDrawer,
      [OverflowSource.COLLECTIONS]: CollectionOverflowMenuDrawer,
      // No case for NOTIFICATIONS because there currently isn't an overflow menu on notifications
      [OverflowSource.PROFILE]: ProfileOverflowMenuDrawer
    }[source] ?? TrackOverflowMenuDrawer

  return (
    <OverflowDrawerComponent
      render={(callbacks) => {
        const rows = (overflowActions ?? []).map((action) => ({
          text: rowMessageMap[action],
          callback: callbacks[action]
        }))
        return <ActionDrawer modalName='Overflow' rows={rows} />
      }}
    />
  )
}
