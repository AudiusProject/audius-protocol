import { useCollections } from './useCollections'
import { useExploreContent } from './useExploreContent'

type Config = {
  staleTime?: number
  enabled?: boolean
  limit?: number
}

export const useFeaturedPlaylists = (config?: Config) => {
  const { data: exploreContent } = useExploreContent(config)
  const { limit, ...restConfig } = config ?? {}

  return useCollections(exploreContent?.featuredPlaylists.slice(0, limit), {
    ...restConfig,
    enabled:
      restConfig?.enabled !== false &&
      !!exploreContent?.featuredPlaylists?.length
  })
}
