import { full } from '@audius/sdk'

import { UserTrackMetadata, UserCollectionMetadata } from '~/models'

import { makePlaylist, makeTrack } from './ResponseAdapter'
import { APIActivity, APIActivityV2, isApiActivityV2 } from './types'

export const makeActivity = (
  activity: APIActivity | APIActivityV2
): UserTrackMetadata | UserCollectionMetadata | undefined => {
  if (isApiActivityV2(activity)) {
    if (!activity.item) {
      return undefined
    }
    if (activity.itemType === 'track') {
      return makeTrack(full.TrackFullToJSON(activity.item as full.TrackFull))
    } else if (activity.itemType === 'playlist') {
      return makePlaylist(
        full.PlaylistFullWithoutTracksToJSON(
          activity.item as full.PlaylistFullWithoutTracks
        )
      )
    }
    return undefined
  } else {
    return activity.item_type === 'track'
      ? makeTrack(activity.item)
      : makePlaylist(activity.item)
  }
}
