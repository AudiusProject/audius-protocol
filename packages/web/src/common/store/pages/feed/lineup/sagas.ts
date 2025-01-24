import { Kind, Collection, LineupTrack } from '@audius/common/models'
import {
  feedPageLineupActions as feedActions,
  CommonState
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'

type FeedItem = LineupTrack | Collection

const keepActivityTimeStamp = (
  entry: (LineupTrack | Collection) & { uid: string } // LineupSaga adds a UID to each entry
) => ({
  uid: entry.uid,
  kind: (entry as LineupTrack).track_id ? Kind.TRACKS : Kind.COLLECTIONS,
  id: (entry as LineupTrack).track_id || (entry as Collection).playlist_id,
  activityTimestamp: entry.activity_timestamp
})

class FeedSagas extends LineupSagas<FeedItem> {
  constructor() {
    super(
      feedActions.prefix,
      feedActions,
      (store: CommonState) => store.pages.feed.feed,
      ({ payload }) => payload?.feed,
      keepActivityTimeStamp,
      undefined,
      undefined
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
