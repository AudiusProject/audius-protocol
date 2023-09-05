import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { SystemAppearance, Theme } from '../../../models/Theme'
import { Nullable } from '../../../utils'

export type ThemeState = {
  theme: Nullable<Theme>
  systemAppearance: Nullable<SystemAppearance>
}

export type SetThemeAction = {
  theme: Theme
}

export type SystemAppearanceAction = {
  systemAppearance: SystemAppearance
}

const initialState: ThemeState = {
  theme: null,
  systemAppearance: null
}

const themeSlice = createSlice({
  name: 'application/ui/theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<SetThemeAction>) => {
      state.theme = action.payload.theme
    },
    setSystemAppearance: (
      state,
      action: PayloadAction<SystemAppearanceAction>
    ) => {
      state.systemAppearance = action.payload.systemAppearance
    }
  }
})

export const { setTheme, setSystemAppearance } = themeSlice.actions
export default themeSlice.reducer
export const actions = themeSlice.actions
