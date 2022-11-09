import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID, Status } from '../../models'

export type RemixSettingsState = {
  trackId: ID | null
  status: Status
}

const initialState: RemixSettingsState = {
  trackId: null,
  status: Status.SUCCESS
}

const slice = createSlice({
  name: 'application/ui/remixSettings',
  initialState,
  reducers: {
    fetchTrack: (state, _: PayloadAction<{ url: string }>) => {
      state.status = Status.LOADING
    },
    fetchTrackSucceeded: (state, action: PayloadAction<{ trackId: ID }>) => {
      const { trackId } = action.payload

      state.status = Status.SUCCESS
      state.trackId = trackId
    },
    fetchTrackFailed: (state) => {
      state.status = Status.ERROR
    },
    reset: () => initialState
  }
})

export const actions = slice.actions
export const { fetchTrack, fetchTrackSucceeded, fetchTrackFailed, reset } =
  slice.actions

export default slice.reducer
