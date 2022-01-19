import { LineupActions } from 'common/store/lineup/actions'

export const PREFIX = 'TRENDING_PLAYLISTS'

class TrendingPlaylistLineupActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const trendingPlaylistLineupActions = new TrendingPlaylistLineupActions()
