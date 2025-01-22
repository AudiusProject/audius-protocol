import { QueryOptions } from './types'
import { useExploreContent } from './useExploreContent'
import { useUsers } from './useUsers'

type Args = {
  limit?: number
}

export const useFeaturedProfiles = (args?: Args, options?: QueryOptions) => {
  const { data: exploreContent } = useExploreContent(options)
  const { limit } = args ?? {}
  return useUsers(exploreContent?.featuredProfiles.slice(0, limit), {
    ...options,
    enabled:
      options?.enabled !== false && !!exploreContent?.featuredProfiles?.length
  })
}
