import { ID, UID, removeNullable } from '@audius/common'
import { all, put, select, takeEvery, call } from 'typed-redux-saga'

import { getContext } from 'common/store'
import { getUserId } from 'common/store/account/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import {
  getOrder,
  getIndex,
  getId as getQueueTrackId,
  getShuffle,
  getShuffleIndex,
  getShuffleOrder,
  getQueueAutoplay
} from 'common/store/queue/selectors'
import {
  persist,
  queueAutoplay,
  repeat,
  shuffle,
  updateIndex
} from 'common/store/queue/slice'
import {
  PersistQueueMessage,
  RepeatModeMessage,
  ShuffleMessage
} from 'services/native-mobile-interface/queue'
import { MessageType, Message } from 'services/native-mobile-interface/types'
import * as playerActions from 'store/player/slice'
import { generateM3U8Variants } from 'utils/hlsUtil'
import { waitForAccount } from 'utils/sagaHelpers'

const PUBLIC_IPFS_GATEWAY = 'http://cloudflare-ipfs.com/ipfs/'
const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

const getImageUrl = (cid: string, gateway: string | null): string => {
  if (!cid) return DEFAULT_IMAGE_URL
  return `${gateway}${cid}`
}

function* getTrackInfo(id: ID, uid: UID) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* waitForAccount()
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return null

  const track = yield* select(getTrack, { id })
  if (!track) return null

  const owner = yield* select(getUser, { id: track.owner_id })
  if (!owner) return null

  const gateways = owner
    ? audiusBackendInstance.getCreatorNodeIPFSGateways(
        owner.creator_node_endpoint
      )
    : []

  const imageHash = track.cover_art_sizes
    ? `${track.cover_art_sizes}/150x150.jpg`
    : track.cover_art
  const largeImageHash = track.cover_art_sizes
    ? `${track.cover_art_sizes}/1000x1000.jpg`
    : track.cover_art

  const m3u8Gateways = gateways.concat(PUBLIC_IPFS_GATEWAY)
  const m3u8 = generateM3U8Variants(track.track_segments, [], m3u8Gateways)
  return {
    title: track.title,
    artist: owner.name,
    artwork: getImageUrl(imageHash!, gateways[0]),
    largeArtwork: getImageUrl(largeImageHash!, gateways[0]),
    uid,
    currentUserId,
    currentListenCount: track.play_count,
    isDelete: track.is_delete || owner.is_deactivated,
    ownerId: track.owner_id,
    trackId: id,
    id,
    genre: track.genre,
    uri: m3u8
  }
}

function* persistQueue() {
  const queueOrder: ReturnType<typeof getOrder> = yield* select(getOrder)
  const queueIndex: ReturnType<typeof getIndex> = yield* select(getIndex)
  const shuffle: ReturnType<typeof getShuffle> = yield* select(getShuffle)
  const shuffleIndex: ReturnType<typeof getShuffleIndex> = yield* select(
    getShuffleIndex
  )
  const shuffleOrder: ReturnType<typeof getShuffleOrder> = yield* select(
    getShuffleOrder
  )
  const queueAutoplay: ReturnType<typeof getQueueAutoplay> = yield* select(
    getQueueAutoplay
  )
  const tracks = yield* all(
    queueOrder.map((queueItem: any) => {
      return call(getTrackInfo, queueItem.id, queueItem.uid)
    })
  )

  const message = new PersistQueueMessage(
    tracks.filter(removeNullable),
    queueIndex,
    shuffle,
    shuffleIndex,
    shuffleOrder,
    queueAutoplay
  )
  message.send()
}

function* watchPersist() {
  yield* takeEvery(persist.type, function* () {
    yield* call(persistQueue)
  })
}

function* watchRepeat() {
  yield* takeEvery(repeat.type, (action: any) => {
    const message = new RepeatModeMessage(action.payload.mode)
    message.send()
  })
}

function* watchShuffle() {
  yield* takeEvery(shuffle.type, function* (action: any) {
    const shuffle: ReturnType<typeof getShuffle> = yield* select(getShuffle)
    const shuffleIndex: ReturnType<typeof getShuffleIndex> = yield* select(
      getShuffleIndex
    )
    const shuffleOrder: ReturnType<typeof getShuffleOrder> = yield* select(
      getShuffleOrder
    )
    const message = new ShuffleMessage(shuffle, shuffleIndex, shuffleOrder)
    message.send()
  })
}

function* watchSyncQueue() {
  yield* takeEvery(MessageType.SYNC_QUEUE, function* (action: Message) {
    const currentIndex = yield* select(getIndex)
    const { index, info } = action
    if (info) {
      console.info(`
        Syncing queue:
        index: ${index},
        id: ${info.trackId},
        uid: ${info.uid},
        title: ${info.title}`)
      yield* put(updateIndex({ index }))
      // Update currently playing track.
      if (!info.isDelete) {
        yield* put(playerActions.set({ uid: info.uid, trackId: info.trackId }))
      } else {
        yield* put(playerActions.stop({}))
      }
      // Only change the play counter for a different song
      if (index !== currentIndex) {
        yield* put(playerActions.incrementCount())
      }
    }
  })
}

function* watchSyncPlayer() {
  yield* takeEvery(MessageType.SYNC_PLAYER, function* (action: Message) {
    const { isPlaying, incrementCounter } = action
    const id = yield* select(getQueueTrackId)
    if (!id) return

    const track = yield* select(getTrack, { id: id as number })
    if (!track) return

    const owner = yield* select(getUser, { id: track?.owner_id })
    if (!owner) return

    console.info(`Syncing player: isPlaying ${isPlaying}`)
    if (track?.is_delete || owner?.is_deactivated) {
      yield* put(playerActions.stop({}))
    } else if (isPlaying) {
      yield* put(playerActions.playSucceeded({}))
    } else {
      yield* put(playerActions.pause({ onlySetState: true }))
    }
    if (incrementCounter) {
      yield* put(playerActions.incrementCount())
    }
  })
}

export function* watchRequestQueueAutoplay() {
  yield* takeEvery(
    MessageType.REQUEST_QUEUE_AUTOPLAY,
    function* (action: Message) {
      const { genre, trackId } = action

      yield* waitForAccount()
      const userId = yield* select(getUserId)
      yield* put(
        queueAutoplay({
          genre,
          exclusionList: trackId ? [trackId] : [],
          currentUserId: userId
        })
      )
    }
  )
}

const sagas = () => {
  return [
    watchPersist,
    watchRepeat,
    watchSyncQueue,
    watchSyncPlayer,
    watchShuffle,
    watchRequestQueueAutoplay
  ]
}

export default sagas
