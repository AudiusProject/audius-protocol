import { useExploreContent } from './useExploreContent'
import { useUsers } from './useUsers'

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useFeaturedProfiles = (config?: Config) => {
  const { data: exploreContent } = useExploreContent(config)
  return useUsers(exploreContent?.featuredProfiles, {
    ...config,
    enabled:
      config?.enabled !== false && !!exploreContent?.featuredProfiles?.length
  })
}
