import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models/Identifiers'

import { SavedPageTabs } from './types'

// Note: Local saves were removed for simplicity. Need to add support back later.

export const getSaved = (state: CommonState) => state.pages.savedPage
export const getTrackSaves = (state: CommonState) =>
  state.pages.savedPage.trackSaves

export const getCollectionsCategory = (state: CommonState) => {
  return state.pages.savedPage.collectionsCategory
}

export const getTracksCategory = (state: CommonState) => {
  return state.pages.savedPage.tracksCategory
}

export const getCategory = (
  state: CommonState,
  props: { currentTab: SavedPageTabs }
) => {
  if (props.currentTab === SavedPageTabs.TRACKS) {
    return getTracksCategory(state)
  } else {
    return getCollectionsCategory(state)
  }
}

export const getInitialFetchStatus = (state: CommonState) =>
  state.pages.savedPage.initialFetch
export const getIsFetchingMore = (state: CommonState) =>
  state.pages.savedPage.fetchingMore
export const hasReachedEnd = (state: CommonState) =>
  state.pages.savedPage.hasReachedEnd

export const getSavedTracksStatus = (state: CommonState) =>
  state.pages.savedPage.tracks.status
export const getSavedTracksLineup = (state: CommonState) =>
  state.pages.savedPage.tracks
export const getSavedTracksLineupUid = (
  state: CommonState,
  props: { id: ID }
) => {
  const track = state.pages.savedPage.tracks.entries.find(
    // @ts-ignore
    (t) => t.id === props.id
  )
  return track ? track.uid : null
}
