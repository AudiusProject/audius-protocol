import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Drawer = 'EnablePushNotifications'

export type DrawersState = { [drawer in Drawer]: boolean }

const initialState: DrawersState = {
  EnablePushNotifications: false
}

const slice = createSlice({
  name: 'DRAWERS',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        drawer: Drawer
        visible: boolean
      }>
    ) => {
      const { drawer, visible } = action.payload
      state[drawer] = visible
    }
  }
})

export const { setVisibility } = slice.actions

export default slice.reducer
