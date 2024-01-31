import { Track } from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksSelectors,
  trackPageLineupActions,
  trackPageSelectors
} from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { call, select } from 'typed-redux-saga'

import { LineupSagas } from 'common/store/lineup/sagas'
import { retrieveUserTracks } from 'common/store/pages/profile/lineups/tracks/retrieveUserTracks'
import { waitForRead } from 'utils/sagaHelpers'
const { PREFIX, tracksActions } = trackPageLineupActions
const { getLineup, getSourceSelector: sourceSelector } = trackPageSelectors
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors

function* getTracks({
  payload,
  offset = 0,
  limit = 6
}: {
  payload?: {
    ownerHandle: string
    /** Permalink of track that should be loaded first */
    heroTrackPermalink: string
  }
  offset?: number
  limit?: number
}) {
  const { ownerHandle, heroTrackPermalink } = payload ?? {}
  yield* waitForRead()
  const currentUserId = yield* select(getUserId)

  const lineup = []
  const heroTrack = yield* call(
    waitForValue,
    getTrack,
    { permalink: heroTrackPermalink },
    // Wait for the track to have a track_id (e.g. remix children could get fetched first)
    (track) => track.track_id
  )
  if (offset === 0) {
    lineup.push(heroTrack)
  }
  const heroTrackRemixParentTrackId =
    heroTrack.remix_of?.tracks?.[0]?.parent_track_id
  if (heroTrackRemixParentTrackId) {
    const remixParentTrack = yield* call(waitForValue, getTrack, {
      id: heroTrackRemixParentTrackId
    })
    if (offset <= 1) {
      lineup.push(remixParentTrack)
    }
  }

  let moreByArtistTracksOffset: number
  if (heroTrackRemixParentTrackId) {
    moreByArtistTracksOffset = offset <= 1 ? 0 : offset - 2
  } else {
    moreByArtistTracksOffset = offset === 0 ? 0 : offset - 1
  }

  const processed = yield* call(retrieveUserTracks, {
    handle: ownerHandle!,
    currentUserId,
    sort: 'plays',
    limit: limit + 2,
    // The hero track is always our first track and the remix parent is always the second track (if any):
    offset: moreByArtistTracksOffset
  })

  return lineup
    .concat(
      processed
        // Filter out any track that matches the `excludePermalink` + the remix parent track (if any)
        .filter(
          (t) =>
            t.permalink !== heroTrackPermalink &&
            t.track_id !== heroTrackRemixParentTrackId
        )
    )
    .slice(0, limit)
}

class TracksSagas extends LineupSagas<Track> {
  constructor() {
    super(
      PREFIX,
      tracksActions,
      // @ts-ignore type is wrongly inferred as LineupState<{ id: number }>
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new TracksSagas().getSagas()
}
