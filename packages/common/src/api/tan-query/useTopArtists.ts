import { QueryOptions } from './types'
import { useSuggestedArtists } from './useSuggestedArtists'
import { useTopArtistsInGenre } from './useTopArtistsInGenre'

export const useTopArtists = (genre: string, config?: QueryOptions) => {
  const { data: suggestedArtists, isPending: isSuggestedPending } =
    useSuggestedArtists({
      ...config,
      enabled: genre === 'Featured' && config?.enabled !== false
    })

  const { data: topArtists, isPending: isTopArtistsPending } =
    useTopArtistsInGenre(
      { genre },
      { ...config, enabled: genre !== 'Featured' && config?.enabled !== false }
    )

  return {
    data: genre === 'Featured' ? suggestedArtists : topArtists,
    isPending: genre === 'Featured' ? isSuggestedPending : isTopArtistsPending
  }
}
