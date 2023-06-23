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
  SquareSizes,
  UserTrackMetadata,
  AudiusBackend,
  UserCollection,
  ID,
  FeatureFlags
} from '@audius/common'
import { isEqual } from 'lodash'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import * as confirmerActions from 'common/store/confirmer/actions'
import { confirmTransaction } from 'common/store/confirmer/sagas'
import { ensureLoggedIn } from 'common/utils/ensureLoggedIn'
import { waitForWrite } from 'utils/sagaHelpers'

import { retrieveTracks } from '../tracks/utils'
import { fetchUsers } from '../users/sagas'

import { confirmOrderPlaylist } from './confirmOrderPlaylist'
import {
  retrieveCollection,
  retrieveCollections
} from './utils/retrieveCollections'

const { getCollection } = cacheCollectionsSelectors
const { setOptimisticChallengeCompleted } = audioRewardsPageActions

type PlaylistWithArtwork = UserCollection & {
  artwork: { file: File; url: string }
}

type AddTrackToPlaylistAction = ReturnType<
  typeof cacheCollectionsActions.addTrackToPlaylist
>

async function getTrackArtworkUrl(
  tracks: UserTrackMetadata[],
  audiusBackend: AudiusBackend
) {
  return await Promise.all(
    tracks.map(async (track) => {
      const { user, cover_art_sizes, cover_art } = track
      const userGateways = audiusBackend.getCreatorNodeIPFSGateways(
        user.creator_node_endpoint
      )

      const imageUrl: string = await audiusBackend.getImageUrl(
        cover_art_sizes || cover_art,
        SquareSizes.SIZE_1000_BY_1000,
        userGateways
      )
      return imageUrl
    })
  )
}

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
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isPlaylistImprovementsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PLAYLIST_UPDATES_PRE_QA
  )
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const web3 = yield* call(audiusBackendInstance.getWeb3)

  // Retrieve tracks with the the collection so we confirm with the
  // most up-to-date information.
  const { collections } = yield* call(retrieveCollections, [playlistId], {
    userId,
    fetchTracks: true,
    forceRetrieveFromSource: true
  })

  const playlist: Nullable<PlaylistWithArtwork> = collections[playlistId]
  if (!playlist) return

  // Retrieve track-to-add so we confirm with the
  // most up-to-date information.
  const [track] = yield* call(retrieveTracks, { trackIds: [trackId] })
  const trackOwnerEntities = yield* call(fetchUsers, [track.owner_id])
  const trackOwner = trackOwnerEntities.entries[track.owner_id]

  if (
    track &&
    trackOwner &&
    playlist.track_count === 3 &&
    isPlaylistImprovementsEnabled
  ) {
    const trackWithUser = { ...track, user: trackOwner }
    const tracks = [...(playlist.tracks ?? []), trackWithUser]
    const first4Tracks = tracks.slice(0, 4)
    if (first4Tracks.length === 4) {
      const trackArtworks = yield* call(
        getTrackArtworkUrl,
        first4Tracks,
        audiusBackendInstance
      )

      const { createPlaylistArtwork } = yield* getContext('imageUtils')

      const artwork = yield* call(createPlaylistArtwork, trackArtworks)
      const { url } = artwork

      playlist.artwork = artwork
      playlist.cover_art_sizes = url
      const coverArtSizes = playlist._cover_art_sizes ?? {}
      coverArtSizes.OVERRIDE = url
      playlist._cover_art_sizes = coverArtSizes
    }
  } else if (track && !playlist.cover_art_sizes) {
    playlist._cover_art_sizes = track._cover_art_sizes
    playlist.cover_art_sizes = track.cover_art_sizes
  }

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
      metadata_time: currentBlock.timestamp as number,
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

  yield* call(
    confirmAddTrackToPlaylist,
    userId,
    action.playlistId,
    action.trackId,
    count,
    playlist
  )
  yield* put(
    cacheActions.update(Kind.COLLECTIONS, [
      {
        id: playlist.playlist_id,
        metadata: {
          playlist_contents: playlist.playlist_contents,
          track_count: count,
          cover_art_sizes: playlist.artwork?.url ?? playlist.cover_art_sizes,
          _cover_art_sizes: playlist.artwork?.url
            ? { OVERRIDE: playlist.artwork.url }
            : playlist._cover_art_sizes
        }
      }
    ])
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
