import { ID, Status } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type State = {
  trackId: ID | null
  status: Status
}

const initialState: State = {
  trackId: null,
  status: Status.SUCCESS
}

const slice = createSlice({
  name: 'application/ui/remixSettingsModal',
  initialState,
  reducers: {
    fetchTrack: (state, action: PayloadAction<{ url: string }>) => {
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

export const { fetchTrack, fetchTrackSucceeded, fetchTrackFailed, reset } =
  slice.actions

export default slice.reducer
