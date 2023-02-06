import type { CollectionMetadata, Track, UserMetadata } from '@audius/common'
import { Kind, makeUid, cacheActions } from '@audius/common'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-use'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import type { TrackOfflineMetadataPayload } from 'app/store/offline-downloads/slice'
import {
  batchSetTrackOfflineMetadata,
  completeCollectionDownload,
  doneLoadingFromDisk
} from 'app/store/offline-downloads/slice'

import {
  getCollectionJson,
  getOfflineCollections,
  getTrackJson,
  listTracks,
  purgeDownloadedCollection,
  verifyTrack
} from '../services/offline-downloader/offline-storage'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'

// Load offline data into redux on app start
export const useLoadOfflineData = () => {
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const dispatch = useDispatch()
  const cacheUsers: { uid: string; id: number; metadata: UserMetadata }[] = []

  useAsync(async () => {
    if (!isOfflineModeEnabled) return

    const offlineCollections = await getOfflineCollections()
    const cacheCollections: {
      id: string
      uid: string
      metadata: CollectionMetadata
    }[] = []
    for (const collectionId of offlineCollections) {
      try {
        if (collectionId === DOWNLOAD_REASON_FAVORITES) {
          dispatch(
            completeCollectionDownload({
              collectionId,
              isFavoritesDownload: false // 'favorites' is not a favorited collection
            })
          )
        } else {
          const collection = await getCollectionJson(collectionId)
          dispatch(
            completeCollectionDownload({
              collectionId,
              isFavoritesDownload: !!collection.offline?.isFavoritesDownload
            })
          )
          cacheCollections.push({
            id: collectionId,
            uid: makeUid(Kind.COLLECTIONS, parseInt(collectionId, 10)),
            metadata: collection
          })
          if (collection.user) {
            cacheUsers.push({
              id: collection.user.user_id,
              uid: makeUid(Kind.USERS, collection.user.user_id),
              metadata: collection.user
            })
          }
        }
      } catch (e) {
        console.warn('Failed to load offline collection', collectionId)
        purgeDownloadedCollection(collectionId)
      }
    }
    dispatch(cacheActions.add(Kind.COLLECTIONS, cacheCollections, false, true))

    const trackIds = await listTracks()
    const cacheTracks: { uid: string; id: number; metadata: Track }[] = []
    const trackOfflineMetadatas: TrackOfflineMetadataPayload[] = []
    await Promise.all(
      trackIds.map(async (trackId) => {
        try {
          const verified = await verifyTrack(trackId, true)
          if (!verified) return
        } catch (e) {
          console.warn('Error verifying track', trackId, e)
        }
        try {
          const track = await getTrackJson(trackId)
          if (!track?.offline) return
          cacheTracks.push({
            id: track.track_id,
            uid: makeUid(Kind.TRACKS, track.track_id),
            metadata: track
          })
          if (track.user) {
            cacheUsers.push({
              id: track.user.user_id,
              uid: makeUid(Kind.USERS, track.user.user_id),
              metadata: track.user
            })
          }
          trackOfflineMetadatas.push({
            trackId: track.track_id,
            offlineMetadata: track.offline
          })
        } catch (e) {
          console.warn('Failed to load track from disk', trackId, e)
        }
      })
    )

    dispatch(cacheActions.add(Kind.TRACKS, cacheTracks, false, true))
    dispatch(cacheActions.add(Kind.USERS, cacheUsers, false, true))
    dispatch(batchSetTrackOfflineMetadata(trackOfflineMetadatas))
    dispatch(doneLoadingFromDisk())
  }, [isOfflineModeEnabled])
}
