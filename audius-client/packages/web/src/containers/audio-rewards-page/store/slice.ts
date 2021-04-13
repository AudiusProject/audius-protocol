import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppState } from 'store/types'

export type TrendingRewardsModalType = 'tracks' | 'playlists' | 'underground'

type RewardsUIState = {
  trendingRewardsModalType: TrendingRewardsModalType
}

const initialState: RewardsUIState = {
  trendingRewardsModalType: 'tracks'
}
const slice = createSlice({
  name: 'rewards-ui',
  initialState,
  reducers: {
    setTrendingRewardsModalType: (
      state,
      action: PayloadAction<{ modalType: TrendingRewardsModalType }>
    ) => {
      const { modalType } = action.payload
      state.trendingRewardsModalType = modalType
    }
  }
})

export const { setTrendingRewardsModalType } = slice.actions

export const getTrendingRewardsModalType = (state: AppState) =>
  state.application.ui.rewardsUI.trendingRewardsModalType

export default slice.reducer
