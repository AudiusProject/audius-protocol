import { Kind, getIdFromKindId, getKindFromKindId } from '@audius/common'
import { select, call } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import { getCollections } from 'common/store/cache/collections/selectors'
import { getTracks } from 'common/store/cache/tracks/selectors'
import {
  PREFIX,
  feedActions
} from 'common/store/pages/profile/lineups/feed/actions'
import {
  getProfileUserId,
  getProfileFeedLineup,
  getProfileUserHandle
} from 'common/store/pages/profile/selectors'
import { getConfirmCalls } from 'store/confirmer/selectors'
import { LineupSagas } from 'store/lineup/sagas'

import { retrieveUserReposts } from './retrieveUserReposts'

function* getReposts({ offset, limit, payload }) {
  const handle = yield select(getProfileUserHandle)
  const profileId = yield select(getProfileUserId)
  const currentUserId = yield select(getUserId)
  let reposts = yield call(retrieveUserReposts, {
    handle,
    currentUserId,
    offset,
    limit
  })

  // If we're on our own profile, add any
  // tracks or collections that haven't confirmed yet.
  // Only do this on page 1 of the reposts tab
  if (profileId === currentUserId && offset === 0) {
    // Get everything that is confirming
    const confirming = yield select(getConfirmCalls)
    if (Object.keys(confirming).length > 0) {
      const repostTrackIds = new Set(
        reposts.map((r) => r.track_id).filter(Boolean)
      )
      const repostCollectionIds = new Set(
        reposts.map((r) => r.playlist_id).filter(Boolean)
      )

      const tracks = yield select(getTracks)
      const collections = yield select(getCollections)

      // For each confirming entry, check if it's a track or collection,
      // then check if we have reposted/favorited it, and check to make
      // sure we're not already getting back that same track or collection from the
      // backend.
      // If we aren't, this is an unconfirmed repost, prepend it to the lineup.
      Object.keys(confirming).forEach((kindId) => {
        const kind = getKindFromKindId(kindId)
        const id = getIdFromKindId(kindId)
        if (kind === Kind.TRACKS) {
          const track = tracks[id]
          if (
            track.has_current_user_reposted &&
            !repostTrackIds.has(track.track_id)
          ) {
            reposts = [track, ...reposts]
          }
        } else if (kind === Kind.COLLECTIONS) {
          const collection = collections[id]
          if (
            collection.has_current_user_reposted &&
            !repostCollectionIds.has(collection.playlist_id)
          ) {
            reposts = [collection, ...reposts]
          }
        }
      })
    }
  }

  return reposts
}

const sourceSelector = (state) => `${PREFIX}:${getProfileUserId(state)}`

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      getProfileFeedLineup,
      getReposts,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
