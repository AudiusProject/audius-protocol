import { TrackMetadata, UID } from '~/models'
import { Uid } from '~/utils'

import { TQCollection } from './models'
import { useTracks } from './useTracks'

export type CollectionTrackWithUid = TrackMetadata & {
  uid: UID
}

/**
 * Returns a list of tracks with UIDs that refer directly to the collection
 * NOTE: not an actual query hook, more of a selector
 */
export const useCollectionTracksWithUid = (
  collection: TQCollection | null | undefined,
  collectionUid: UID
) => {
  const collectionSource = Uid.fromString(collectionUid).source

  const { byId } = useTracks(collection?.trackIds)

  // Return tracks & rebuild UIDs for the track so they refer directly to this collection
  return collection?.playlist_contents?.track_ids
    .map((t, i) => {
      const { uid, track: trackId } = t ?? {}
      const trackUid = Uid.fromString(uid ?? '')
      trackUid.source = `${collectionSource}:${trackUid.source}`
      trackUid.count = i

      if (!byId?.[trackId]) {
        console.error(`Found empty track ${trackId}`)
        return null
      }
      return {
        ...byId[trackId],
        uid: trackUid.toString()
      }
    })
    .filter(Boolean) as CollectionTrackWithUid[]
}
