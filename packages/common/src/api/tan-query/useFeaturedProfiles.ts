import { QueryOptions } from './types'
import { useExploreContent } from './useExploreContent'
import { useUsers } from './useUsers'

type Args = {
  limit?: number
}

export const useFeaturedProfiles = (args?: Args, config?: QueryOptions) => {
  const { data: exploreContent } = useExploreContent(config)
  const { limit } = args ?? {}
  return useUsers(exploreContent?.featuredProfiles.slice(0, limit), {
    ...config,
    enabled:
      config?.enabled !== false && !!exploreContent?.featuredProfiles?.length
  })
}
