import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

const STATIC_EXPLORE_CONTENT_URL =
  'https://download.audius.co/static-resources/explore-content.json'

type ExploreContentResponse = {
  featuredPlaylists: string[]
  featuredProfiles: string[]
}

export const getExploreContentQueryKey = () => [QUERY_KEYS.exploreContent]

export const useExploreContent = (options?: QueryOptions) => {
  const { env } = useAudiusQueryContext()
  const exploreContentUrl =
    env.EXPLORE_CONTENT_URL ?? STATIC_EXPLORE_CONTENT_URL

  return useQuery({
    queryKey: getExploreContentQueryKey(),
    queryFn: async () => {
      const response = await fetch(exploreContentUrl)
      const json: ExploreContentResponse = await response.json()
      return {
        featuredPlaylists: json.featuredPlaylists.map(
          (id: string) => parseInt(id) as ID
        ),
        featuredProfiles: json.featuredProfiles.map(
          (id: string) => parseInt(id) as ID
        )
      }
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false
  })
}
