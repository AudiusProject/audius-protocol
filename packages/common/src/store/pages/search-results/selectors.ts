import { createSelector } from 'reselect'

import { getCollections } from '~/store/cache/collections/selectors'
import { getUsers } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'
import { createShallowSelector } from '~/utils/selectorHelpers'

// Search Results selectors
export const getBaseState = (state: CommonState) => state.pages.searchResults
export const getSearchText = (state: CommonState) =>
  getBaseState(state).searchText
export const getIsTagSearch = (state: CommonState) =>
  getBaseState(state).isTagSearch
export const getSearchTracksLineup = (state: CommonState) =>
  getBaseState(state).tracks
export const getSearchResults = (state: CommonState) => getBaseState(state)
export const getSearchStatus = (state: CommonState) =>
  getBaseState(state).status
export const getSearchResultsPageTracks = (state: CommonState) =>
  getBaseState(state).trackIds || []

const getSearchArtistsIds = (state: CommonState) =>
  getBaseState(state).artistIds || []
const getUnsortedSearchArtists = createShallowSelector(
  [getSearchArtistsIds, (state) => state],
  (artistIds, state) => getUsers(state, { ids: artistIds || [] })
)
export const makeGetSearchArtists = () => {
  return createSelector(
    [getSearchArtistsIds, getUnsortedSearchArtists],
    (ids, artists) =>
      ids.map((id) => artists[id]).filter((a) => !a.is_deactivated)
  )
}

const getSearchAlbums = (state: CommonState) =>{
  const albumIds = getBaseState(state).albumIds
  const collections = getCollections(state, { ids: albumIds || [] })
  return albumIds?.map(id => collections[id]) ?? []
}

export const makeGetSearchAlbums = () => {
  return createShallowSelector([getSearchAlbums, getUsers], (albums, users) =>
    Object.values(albums)
      .map((album) => {
        return {
          ...album,
          user: users[album.playlist_owner_id]
        }
      })
      .filter((album) => !!album.user && !album.user.is_deactivated)
  )
}

const getSearchPlaylists = (state: CommonState) => {
  const playlistIds = getBaseState(state).playlistIds
  const collections = getCollections(state, { ids: playlistIds || [] })
  return playlistIds?.map(id => collections[id]) ?? []
}

export const makeGetSearchPlaylists = () => {
  return createShallowSelector(
    [getSearchPlaylists, getUsers],
    (playlists, users) =>
      Object.values(playlists)
        .map((playlist) => {
          return {
            ...playlist,
            user: users[playlist.playlist_owner_id],
            trackCount: (playlist.playlist_contents.track_ids || []).length
          }
        })
        .filter((playlist) => !!playlist.user && !playlist.user.is_deactivated)
  )
}
