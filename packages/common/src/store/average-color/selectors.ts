import { CID, Color, Track } from '~/models'
import { Nullable } from '~/utils'

import { CommonState } from '../reducers'

export const getAverageColor = (
  state: CommonState,
  { multihash }: { multihash: Nullable<CID> }
): Nullable<Color> =>
  (multihash && state.ui.averageColor.averageColor[multihash]) || null

export const getAverageColorByTrack = (
  state: CommonState,
  { track }: { track: Nullable<Track> }
): Nullable<Color> => {
  const multihash = track?.cover_art_sizes ?? track?.cover_art
  if (!multihash) return null
  return state.ui.averageColor.averageColor[multihash] ?? null
}

export const getDominantColorsByTrack = (
  state: CommonState,
  { track }: { track: Nullable<Track> }
): Nullable<Color[]> => {
  const multihash = track?.cover_art_sizes ?? track?.cover_art
  if (!multihash) return null
  return state.ui.averageColor.dominantColors[multihash] ?? null
}

export const selectors = {
  getAverageColor,
  getAverageColorByTrack,
  getDominantColorsByTrack
}
