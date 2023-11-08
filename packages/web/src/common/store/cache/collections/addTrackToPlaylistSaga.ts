import {
  Name,
  Kind,
  makeKindId,
  makeUid,
  cacheCollectionsSelectors,
  cacheCollectionsActions,
  PlaylistOperations,
  cacheActions,
  getContext,
  audioRewardsPageActions,
  Collection,
  Nullable,
  ID,
  cacheTracksSelectors,
  updatePlaylistArtwork,
  confirmerActions,
  confirmTransaction
} from '@audius/common'
import { isEqual } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

import { confirmOrderPlaylist } from './confirmOrderPlaylist'
import { optimisticUpdateCollection } from './utils/optimisticUpdateCollection'
import {
  retrieveCollection,
  retrieveCollections
} from './utils/retrieveCollections'

const { getCollection, getCollectionTracks } = cacheCollectionsSelectors
const { getTrack } = cacheTracksSelectors
const { setOptimisticChallengeCompleted } = audioRewardsPageActions

type AddTrackToPlaylistAction = ReturnType<
  typeof cacheCollectionsActions.addTrackToPlaylist
>

/** ADD TRACK TO PLAYLIST */

export function* watchAddTrackToPlaylist() {
  yield* takeEvery(
    cacheCollectionsActions.ADD_TRACK_TO_PLAYLIST,
    addTrackToPlaylistAsync
  )
}

function* addTrackToPlaylistAsync(action: AddTrackToPlaylistAction) {
  const { playlistId, trackId } = action
  yield* waitForWrite()
  const userId = yield* call(ensureLoggedIn)
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const web3 = yield* call(audiusBackendInstance.getWeb3)
  const { generatePlaylistArtwork } = yield* getContext('imageUtils')

  // Retrieve tracks with the the collection so we confirm with the
  // most up-to-date information.
  const { collections } = yield* call(retrieveCollections, [playlistId], {
    userId,
    fetchTracks: true,
    forceRetrieveFromSource: true
  })

  let playlist: Nullable<Collection> = collections[playlistId]
  const playlistTracks = yield* select(getCollectionTracks, { id: playlistId })
  const track = yield* select(getTrack, { id: trackId })

  if (!playlist || !playlistTracks || !track) return

  playlist = yield* call(
    updatePlaylistArtwork,
    playlist,
    playlistTracks,
    {
      added: track
    },
    {
      audiusBackend: audiusBackendInstance,
      generateImage: generatePlaylistArtwork
    }
  )

  const trackUid = makeUid(
    Kind.TRACKS,
    action.trackId,
    `collection:${action.playlistId}`
  )
  const currentBlockNumber = yield* call([web3.eth, 'getBlockNumber'])
  const currentBlock = (yield* call(
    [web3.eth, 'getBlock'],
    currentBlockNumber
  )) as { timestamp: number }

  playlist.playlist_contents = {
    track_ids: playlist.playlist_contents.track_ids.concat({
      track: action.trackId,
      metadata_time: currentBlock?.timestamp as number,
      time: 0,
      uid: trackUid
    })
  }
  const count = playlist.track_count + 1

  const event = make(Name.PLAYLIST_ADD, {
    trackId: action.trackId,
    playlistId: action.playlistId
  })

  yield* put(event)

  yield* call(optimisticUpdateCollection, { ...playlist, track_count: count })
  yield* call(
    confirmAddTrackToPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    count,
    playlist
  )

  yield* put(
    cacheActions.subscribe(Kind.TRACKS, [{ uid: trackUid, id: action.trackId }])
  )
  yield* put(
    setOptimisticChallengeCompleted({
      challengeId: 'first-playlist',
      specifier: userId.toString()
    })
  )
}

function* confirmAddTrackToPlaylist(
  userId: ID,
  playlistId: ID,
  trackId: ID,
  count: number,
  playlist: Collection
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* () {
        const { blockHash, blockNumber, error } = yield* call(
          audiusBackendInstance.addPlaylistTrack,
          playlist
        )
        if (error) throw error

        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm add playlist track for playlist id ${playlistId} and track id ${trackId}`
          )
        }
        return playlistId
      },
      function* (confirmedPlaylistId: ID) {
        const [confirmedPlaylist] = yield* call(retrieveCollection, {
          playlistId: confirmedPlaylistId
        })

        const playlist = yield* select(getCollection, { id: playlistId })
        if (!playlist) return

        /** Since "add track" calls are parallelized, tracks may be added
         * out of order. Here we check if tracks made it in the intended order;
         * if not, we reorder them into the correct order.
         */
        const numberOfTracksMatch =
          confirmedPlaylist.playlist_contents.track_ids.length ===
          playlist.playlist_contents.track_ids.length

        const confirmedPlaylistHasTracks =
          confirmedPlaylist.playlist_contents.track_ids.length > 0

        if (numberOfTracksMatch && confirmedPlaylistHasTracks) {
          const confirmedPlaylistTracks =
            confirmedPlaylist.playlist_contents.track_ids.map((t) => t.track)
          const cachedPlaylistTracks = playlist.playlist_contents.track_ids.map(
            (t) => t.track
          )
          if (!isEqual(confirmedPlaylistTracks, cachedPlaylistTracks)) {
            yield* call(
              confirmOrderPlaylist,
              userId,
              playlistId,
              cachedPlaylistTracks
            )
          } else {
            yield* put(
              cacheActions.update(Kind.COLLECTIONS, [
                {
                  id: confirmedPlaylist.playlist_id,
                  metadata: confirmedPlaylist
                }
              ])
            )
          }
        }
      },
      function* ({ error, timeout, message }) {
        // Fail Call
        yield* put(
          cacheCollectionsActions.addTrackToPlaylistFailed(
            error,
            { userId, playlistId, trackId, count },
            { message, timeout }
          )
        )
      },
      (result: { playlist_id: Nullable<ID> }) =>
        result.playlist_id ? result.playlist_id : playlistId,
      undefined,
      {
        operationId: PlaylistOperations.ADD_TRACK,
        parallelizable: false,
        useOnlyLastSuccessCall: false,
        squashable: true
      }
    )
  )
}
