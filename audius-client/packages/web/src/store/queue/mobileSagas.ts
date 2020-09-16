import { all, put, select, takeEvery, call } from 'redux-saga/effects'

import { ID, UID } from 'models/common/Identifiers'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUser } from 'store/cache/users/selectors'
import { play, repeat, updateIndex } from 'store/queue/slice'
import * as playerActions from 'store/player/slice'
import { getOrder, getIndex, getId as getQueueTrackId } from './selectors'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { generateM3U8Variants } from 'utils/hlsUtil'
import {
  PersistQueueMessage,
  RepeatModeMessage
} from 'services/native-mobile-interface/queue'
import { MessageType, Message } from 'services/native-mobile-interface/types'
import { getUserId } from 'store/account/selectors'
import Track from 'models/Track'
import User from 'models/User'

const PUBLIC_IPFS_GATEWAY = 'http://cloudflare-ipfs.com/ipfs/'
const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

const getImageUrl = (cid: string, gateway: string | null): string => {
  if (!cid) return DEFAULT_IMAGE_URL
  return `${gateway}${cid}`
}

function* getTrackInfo(id: ID, uid: UID) {
  const currentUserId = yield select(getUserId)
  const track: Track = yield select(getTrack, { id })
  const owner: User = yield select(getUser, { id: track.owner_id })
  const gateways = owner
    ? getCreatorNodeIPFSGateways(owner.creator_node_endpoint)
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
    isDelete: track.is_delete,
    ownerId: track.owner_id,
    trackId: id,
    uri: m3u8
  }
}

function* persistQueue() {
  const queueOrder = yield select(getOrder)
  const queueIndex = yield select(getIndex)
  const tracks = yield all(
    queueOrder.map((queueItem: any) => {
      return call(getTrackInfo, queueItem.id, queueItem.uid)
    })
  )
  const message = new PersistQueueMessage(tracks, queueIndex)
  message.send()
}

function* watchPlay() {
  yield takeEvery(play.type, function* () {
    yield call(persistQueue)
  })
}

function* watchRepeat() {
  yield takeEvery(repeat.type, (action: any) => {
    const message = new RepeatModeMessage(action.mode)
    message.send()
  })
}

function* watchSyncQueue() {
  yield takeEvery(MessageType.SYNC_QUEUE, function* (action: Message) {
    const currentIndex = yield select(getIndex)
    const { index, info } = action
    if (info) {
      console.info(`
        Syncing queue:
        index: ${index},
        id: ${info.trackId},
        uid: ${info.uid},
        title: ${info.title}`)
      yield put(updateIndex({ index }))
      // Update currently playing track.
      if (!info.isDelete) {
        yield put(playerActions.set({ uid: info.uid, trackId: info.trackId }))
      } else {
        yield put(playerActions.stop({}))
      }
      // Only change the play counter for a different song
      if (index !== currentIndex) {
        yield put(playerActions.incrementCount())
      }
    }
  })
}

function* watchSyncPlayer() {
  yield takeEvery(MessageType.SYNC_PLAYER, function* (action: Message) {
    const { isPlaying } = action
    const id = yield select(getQueueTrackId)
    const track = yield select(getTrack, { id })
    console.info(`Syncing player: isPlaying ${isPlaying}`)
    if (track?.is_delete) {
      yield put(playerActions.stop({}))
    } else if (isPlaying) {
      yield put(playerActions.playSucceeded({}))
    } else {
      yield put(playerActions.pause({ onlySetState: true }))
    }
  })
}

const sagas = () => {
  return [watchPlay, watchRepeat, watchSyncQueue, watchSyncPlayer]
}

export default sagas
