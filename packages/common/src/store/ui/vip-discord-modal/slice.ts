import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Nullable } from '../../../utils/typeUtils'

import { VipDiscordModalState } from './types'

const initialState: VipDiscordModalState = {
  discordCode: null
}

const slice = createSlice({
  name: 'ui/vipDiscordModal',
  initialState,
  reducers: {
    pressDiscord: (_state, _action: PayloadAction<undefined>) => {},
    setDiscordCode: (
      state,
      { payload: { code } }: PayloadAction<{ code: Nullable<string> }>
    ) => {
      state.discordCode = code
    }
  }
})

export const { pressDiscord, setDiscordCode } = slice.actions
export const actions = slice.actions
export default slice.reducer
