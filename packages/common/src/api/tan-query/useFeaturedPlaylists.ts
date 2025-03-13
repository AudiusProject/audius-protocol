import { TQCollection } from './models'
import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useExploreContent } from './useExploreContent'

type Args = {
  limit?: number
}

export const useFeaturedPlaylists = (
  args?: Args,
  options?: Omit<QueryOptions<TQCollection[]>, 'select'>
) => {
  const { data: exploreContent } = useExploreContent()
  const { limit } = args ?? {}

  return useCollections(exploreContent?.featuredPlaylists.slice(0, limit), {
    ...options,
    enabled:
      options?.enabled !== false && !!exploreContent?.featuredPlaylists?.length
  })
}
