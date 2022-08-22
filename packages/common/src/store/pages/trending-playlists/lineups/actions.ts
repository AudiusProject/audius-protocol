import { LineupActions } from '../../../lineup/actions'

export const PREFIX = 'TRENDING_PLAYLISTS'

class TrendingPlaylistsPageLineupActions extends LineupActions {
  constructor() {
    super(PREFIX)
  }
}

export const trendingPlaylistsPageLineupActions =
  new TrendingPlaylistsPageLineupActions()
