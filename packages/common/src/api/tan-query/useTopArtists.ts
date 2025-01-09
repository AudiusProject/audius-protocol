import { Config } from './types'
import { useSuggestedArtists } from './useSuggestedArtists'
import { useTopArtistsInGenre } from './useTopArtistsInGenre'

export const useTopArtists = (genre: string, config?: Config) => {
  const { data: suggestedArtists, status: suggestedStatus } =
    useSuggestedArtists({
      ...config,
      enabled: genre === 'Featured' && config?.enabled !== false
    })

  const { data: topArtists, status: topStatus } = useTopArtistsInGenre(
    { genre },
    { ...config, enabled: genre !== 'Featured' && config?.enabled !== false }
  )

  return {
    data: genre === 'Featured' ? suggestedArtists : topArtists,
    status: genre === 'Featured' ? suggestedStatus : topStatus
  }
}
