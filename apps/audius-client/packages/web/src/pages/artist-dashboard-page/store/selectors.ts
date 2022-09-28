import { accountSelectors } from '@audius/common'
import { createSelector } from 'reselect'

import { AppState } from 'store/types'
const getAccountUser = accountSelectors.getAccountUser

// Dashboard selectors
export const getDashboardTracksStatus = (state: AppState) =>
  state.dashboard.tracksStatus
export const getDashboardStatus = (state: AppState) => state.dashboard.status
export const getDashboardTracks = (state: AppState) => state.dashboard.tracks
export const getUnlistedDashboardTracks = (state: AppState) =>
  state.dashboard.unlistedTracks
export const getDashboardListenData = (state: AppState) =>
  state.dashboard.listenData

export const makeGetDashboard = () => {
  return createSelector(
    [getAccountUser, getDashboardTracks, getUnlistedDashboardTracks],
    (account, tracks, unlistedTracks) => {
      const stats = {
        tracks: account ? account.track_count : 0,
        playlists: account ? account.playlist_count : 0,
        // albums: account ? account.album_count : 0,
        plays: tracks.reduce(
          (totalPlays, track) => totalPlays + (track.play_count || 0),
          0
        ),
        reposts: account ? account.repost_count : 0,
        // saves: account ? 0,
        followers: account ? account.follower_count : 0
      }
      return {
        account,
        tracks,
        unlistedTracks,
        stats
      }
    }
  )
}
