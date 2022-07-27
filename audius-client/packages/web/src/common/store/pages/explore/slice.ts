import { Status } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import ExplorePageState, { ExploreContent, Tabs } from './types'

const initialState: ExplorePageState = {
  playlists: [],
  profiles: [],
  status: Status.SUCCESS,
  tab: Tabs.FOR_YOU
}

type FetchExploreSucceededPayload = {
  exploreContent: ExploreContent
}

type SetTabPayload = {
  tab: Tabs
}

const slice = createSlice({
  name: 'explore-page',
  initialState,
  reducers: {
    fetchExplore: (state) => {
      state.status = Status.LOADING
    },
    fetchExploreSucceeded: (
      state,
      action: PayloadAction<FetchExploreSucceededPayload>
    ) => {
      const { featuredPlaylists, featuredProfiles } =
        action.payload.exploreContent
      state.playlists = featuredPlaylists
      state.profiles = featuredProfiles
      state.status = Status.SUCCESS
    },
    fetchExploreFailed: (state) => {
      state.status = Status.ERROR
    },
    setTab: (state, action: PayloadAction<SetTabPayload>) => {
      state.tab = action.payload.tab
    }
  }
})

export const {
  fetchExplore,
  fetchExploreSucceeded,
  fetchExploreFailed,
  setTab
} = slice.actions

export default slice.reducer
