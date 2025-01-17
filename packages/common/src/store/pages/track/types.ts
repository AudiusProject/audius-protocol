import { ID, LineupState, Track } from '../../../models'

export type TrackPageState = {
  trackId: ID | null
  trackPermalink: string | null
  tracks: LineupState<Track>
}
