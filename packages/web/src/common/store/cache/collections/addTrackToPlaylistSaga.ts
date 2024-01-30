import {
  cacheCollectionsSelectors,
  cacheCollectionsActions,
  PlaylistOperations,
  cacheActions,
  getContext,
  audioRewardsPageActions,
  cacheTracksSelectors,
  confirmerActions,
  confirmTransaction,
  reformatCollection,
  toastActions
} from '@audius/common'
import { Name, Kind, Collection, ID } from '@audius/common/models'
import {
  makeUid,
  makeKindId,
  updatePlaylistArtwork,
  Nullable
} from '@audius/common/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

import { optimisticUpdateCollection } from './utils/optimisticUpdateCollection'
import { retrieveCollection } from './utils/retrieveCollections'

const { getCollection, getCollectionTracks } = cacheCollectionsSelectors
const { getTrack } = cacheTracksSelectors
const { setOptimisticChallengeCompleted } = audioRewardsPageActions

const { toast } = toastActions

const messages = {
  addedTrack: (collectionType: 'album' | 'playlist') =>
    `Added track to ${collectionType}`
}

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

  let playlist = yield* select(getCollection, { id: playlistId })
  const playlistTracks = yield* select(getCollectionTracks, { id: playlistId })
  const track = yield* select(getTrack, { id: trackId })

  if (!playlist || !playlistTracks || !track) return

  const trackUid = makeUid(
    Kind.TRACKS,
    action.trackId,
    `collection:${action.playlistId}`
  )

  yield* put(
    cacheActions.subscribe(Kind.TRACKS, [{ uid: trackUid, id: action.trackId }])
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
  playlist.track_count = count

  // Optimistic update #1 to show track in playlist quickly
  yield* call(optimisticUpdateCollection, playlist)

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

  // Optimistic update #2 to show updated artwork
  yield* call(optimisticUpdateCollection, playlist)

  yield* call(
    confirmAddTrackToPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    count,
    playlist
  )

  yield* put(
    setOptimisticChallengeCompleted({
      challengeId: 'first-playlist',
      specifier: userId.toString()
    })
  )

  const event = make(Name.PLAYLIST_ADD, {
    trackId: action.trackId,
    playlistId: action.playlistId
  })

  yield* put(event)

  yield* put(
    toast({
      content: messages.addedTrack(playlist.is_album ? 'album' : 'playlist')
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

        const formattedCollection = reformatCollection({
          collection: confirmedPlaylist,
          audiusBackendInstance
        })

        yield* put(
          cacheActions.update(Kind.COLLECTIONS, [
            {
              id: confirmedPlaylist.playlist_id,
              metadata: { ...formattedCollection, artwork: {} }
            }
          ])
        )
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
