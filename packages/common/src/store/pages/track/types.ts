import { ID, LineupState, Track } from '../../../models'

export type TrackPageState = {
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
  tracks: LineupState<Track>
  isInitialFetchAfterSsr: boolean
}
