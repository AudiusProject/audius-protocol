import { call } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'

import {
  PREFIX,
  moreByActions
} from 'containers/deleted-page/store/lineups/more-by/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getLineup } from 'containers/deleted-page/store/selectors'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { ID } from 'models/common/Identifiers'
import Track, { UserTrack } from 'models/Track'

function* getTracks({
  offset,
  limit,
  payload
}: {
  offset: number
  limit: number
  payload: { userId: ID | null }
}) {
  const { userId } = payload
  const tracks: UserTrack[] = yield call(AudiusBackend.getArtistTracks, {
    offset,
    limit,
    userId,
    filterDeleted: true
  })
  const processed: Track[] = yield call(processAndCacheTracks, tracks)

  return (
    processed
      // Sort by listen count desc
      .sort((a, b) => b.play_count - a.play_count)
      // Take only the first 5
      .slice(0, 5)
  )
}

const sourceSelector = () => PREFIX

class MoreBySagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      moreByActions,
      getLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new MoreBySagas().getSagas()
}
