import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import Color from 'models/common/Color'
import { CID } from 'models/common/Identifiers'
import { AppState } from 'store/types'

const initialState: { colors: { [multihash: string]: Color } } = {
  colors: {}
}

/**
 * This slice tracks computed average colors for a given track art CID.
 * Colors is a map of art cid -> Color
 */
const slice = createSlice({
  name: 'application/ui/averageColor',
  initialState,
  reducers: {
    setColor: (
      state,
      action: PayloadAction<{ multihash: string; color: Color }>
    ) => {
      const { multihash, color } = action.payload
      state.colors[multihash] = color
    }
  }
})

export const { setColor } = slice.actions

export const getAverageColor = (
  state: AppState,
  { multihash }: { multihash: CID }
): Color | undefined => state.application.ui.averageColor.colors[multihash]

export default slice.reducer
