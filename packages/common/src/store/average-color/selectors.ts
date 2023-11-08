import { Nullable } from 'utils/typeUtils'

import { Color } from '../../models/Color'
import { CID } from '../../models/Identifiers'
import { Track } from '../../models/Track'
import { CommonState } from '../commonStore'

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
