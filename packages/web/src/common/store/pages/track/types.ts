import { ID } from '@audius/common'

import { LineupState } from 'common/models/Lineup'

export default interface TrackPageState {
  trackId: ID | null
  trackPermalink: string | null
  rank: {
    week: number | null
    month: number | null
    year: number | null
  }
  trendingTrackRanks: {
    week: ID[] | null
    month: ID[] | null
    year: ID[] | null
  }
  tracks: LineupState<{ id: ID }>
}
