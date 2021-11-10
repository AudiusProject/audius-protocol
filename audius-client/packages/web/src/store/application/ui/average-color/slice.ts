import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Color from 'common/models/Color'
import { CID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import { Nullable } from 'common/utils/typeUtils'
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
  { multihash }: { multihash: Nullable<CID> }
): Nullable<Color> =>
  (multihash && state.application.ui.averageColor.colors[multihash]) || null

export const getAverageColorByTrack = (
  state: AppState,
  { track }: { track: Nullable<Track> }
): Nullable<Color> => {
  const multihash = track?.cover_art_sizes ?? track?.cover_art
  if (!multihash) return null
  return state.application.ui.averageColor.colors[multihash] ?? null
}

export default slice.reducer
