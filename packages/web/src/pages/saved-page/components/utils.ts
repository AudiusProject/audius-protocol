import { formatCount } from '@audius/common/utils'

export const formatCardSecondaryText = (saves: number, tracks: number) => {
  const savesText = saves === 1 ? 'Favorite' : 'Favorites'
  const tracksText = tracks === 1 ? 'Track' : 'Tracks'
  return `${formatCount(saves)} ${savesText} • ${tracks} ${tracksText}`
}
