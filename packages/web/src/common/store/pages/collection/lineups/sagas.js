import { Kind } from '@audius/common/models'
import {
  smartCollectionPageSelectors,
  collectionPageLineupActions as tracksActions,
  collectionPageSelectors,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { select } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
const {
  getSmartCollectionVariant,
  getCollectionId,
  getCollectionTracksLineup
} = collectionPageSelectors
const { getCollection } = cacheCollectionsSelectors
const { getCollection: getSmartCollection } = smartCollectionPageSelectors

function* getCollectionTracks() {
  const smartCollectionVariant = yield select(getSmartCollectionVariant)
  let collection
  if (smartCollectionVariant) {
    collection = yield select(getSmartCollection, {
      variant: smartCollectionVariant
    })
    return collection.tracks
  } else {
    const collectionId = yield select(getCollectionId)
    const collection = yield select(getCollection, { id: collectionId })
    return collection.tracks
  }
}

const keepDateAdded = (track) => ({
  id: track.track_id,
  uid: track.uid,
  kind: Kind.TRACKS,
  dateAdded: track.dateAdded
})

const sourceSelector = (state) => `collection:${getCollectionId(state)}`

class TracksSagas extends LineupSagas {
  constructor() {
    super(
      tracksActions.prefix,
      tracksActions,
      getCollectionTracksLineup,
      getCollectionTracks,
      keepDateAdded,
      /* removeDeleted */ false,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
