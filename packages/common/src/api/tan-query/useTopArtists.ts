import { QueryOptions } from './types'
import { useSuggestedArtists } from './useSuggestedArtists'
import { useTopArtistsInGenre } from './useTopArtistsInGenre'

export const useTopArtists = (genre: string, options?: QueryOptions) => {
  const { data: suggestedArtists, isPending: isSuggestedPending } =
    useSuggestedArtists({
      ...options,
      enabled: genre === 'Featured' && options?.enabled !== false
    })

  const { data: topArtists, isPending: isTopArtistsPending } =
    useTopArtistsInGenre(
      { genre },
      {
        ...options,
        enabled: genre !== 'Featured' && options?.enabled !== false
      }
    )

  return {
    data: genre === 'Featured' ? suggestedArtists : topArtists,
    isPending: genre === 'Featured' ? isSuggestedPending : isTopArtistsPending
  }
}
