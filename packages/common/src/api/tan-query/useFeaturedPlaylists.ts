import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useExploreContent } from './useExploreContent'

type Args = {
  limit?: number
}

export const useFeaturedPlaylists = (args?: Args, options?: QueryOptions) => {
  const { data: exploreContent } = useExploreContent(options)
  const { limit } = args ?? {}

  return useCollections(exploreContent?.featuredPlaylists.slice(0, limit), {
    ...options,
    enabled:
      options?.enabled !== false && !!exploreContent?.featuredPlaylists?.length
  })
}
