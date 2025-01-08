import { Config } from './types'
import { useCollections } from './useCollections'
import { useExploreContent } from './useExploreContent'

type Args = {
  limit?: number
}

export const useFeaturedPlaylists = (args?: Args, config?: Config) => {
  const { data: exploreContent } = useExploreContent(config)
  const { limit } = args ?? {}

  return useCollections(exploreContent?.featuredPlaylists.slice(0, limit), {
    ...config,
    enabled:
      config?.enabled !== false && !!exploreContent?.featuredPlaylists?.length
  })
}
