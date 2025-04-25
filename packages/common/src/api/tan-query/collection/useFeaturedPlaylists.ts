import { QueryOptions } from '../types'
import { useExploreContent } from './useExploreContent'

import { useCollections } from './useCollections'

type Args = {
  limit?: number
}

export const useFeaturedPlaylists = (args?: Args, options?: QueryOptions) => {
  const { data: exploreContent } = useExploreContent()
  const { limit } = args ?? {}

  return useCollections(exploreContent?.featuredPlaylists.slice(0, limit), {
    ...options,
    enabled:
      options?.enabled !== false && !!exploreContent?.featuredPlaylists?.length
  })
}
