import {
  fileToSdk,
  playlistMetadataForUpdateWithSDK
} from '@audius/common/adapters'
import {
  Name,
  Kind,
  Collection,
  ID,
  ChallengeName
} from '@audius/common/models'
import {
  cacheCollectionsActions,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheActions,
  PlaylistOperations,
  reformatCollection,
  audioRewardsPageActions,
  toastActions,
  getContext,
  confirmerActions,
  getSDK
} from '@audius/common/store'
import {
  makeUid,
  makeKindId,
  updatePlaylistArtwork,
  Nullable
} from '@audius/common/utils'
import { Id } from '@audius/sdk'
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
  const isNative = yield* getContext('isNativeMobile')
  const sdk = yield* getSDK()
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
  const { timestamp: currentBlockTimestamp } = yield* call([
    sdk.services.entityManager,
    sdk.services.entityManager.getCurrentBlock
  ])

  playlist.playlist_contents = {
    track_ids: playlist.playlist_contents.track_ids.concat({
      track: action.trackId,
      // Replaced in indexing with block timestamp
      // Represents the server time seen when track was added to playlist
      time: 0,
      // Represents user-facing timestamp when the user added the track to the playlist.
      // This is needed to disambiguate between tracks added at the same time/potentiall in
      // the same block.
      metadata_time: currentBlockTimestamp,
      uid: trackUid
    })
  }

  const count = playlist.track_count + 1
  playlist.track_count = count

  // Optimistic update #1 to show track in playlist quickly
  if (isNative) {
    yield* call(optimisticUpdateCollection, playlist)
  }

  playlist = yield* call(
    updatePlaylistArtwork,
    playlist,
    playlistTracks,
    { added: track },
    {
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

  yield* put(
    setOptimisticChallengeCompleted({
      challengeId: ChallengeName.FirstPlaylist,
      specifier: Id.parse(userId)
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
  const sdk = yield* getSDK()

  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.COLLECTIONS, playlistId),
      function* () {
        const { artwork } = playlist
        const coverArtFile =
          artwork && 'file' in artwork ? (artwork?.file ?? null) : null

        yield* call([sdk.playlists, sdk.playlists.updatePlaylist], {
          metadata: playlistMetadataForUpdateWithSDK(playlist),
          userId: Id.parse(userId),
          playlistId: Id.parse(playlistId),
          coverArtFile: coverArtFile
            ? fileToSdk(coverArtFile, 'cover_art')
            : undefined
        })

        return playlistId
      },
      function* (confirmedPlaylistId: ID) {
        const [confirmedPlaylist] = yield* call(retrieveCollection, {
          playlistId: confirmedPlaylistId
        })

        const playlist = yield* select(getCollection, { id: playlistId })
        if (!playlist) return

        const formattedCollection = reformatCollection({
          collection: confirmedPlaylist
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
