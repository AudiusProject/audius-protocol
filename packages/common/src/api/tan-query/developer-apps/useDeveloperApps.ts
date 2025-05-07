import { Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'

import { DeveloperApp } from './developerApps'

export const getDeveloperAppsQueryKey = (userId: Nullable<ID>) => {
  return [QUERY_KEYS.developerApps, userId] as unknown as QueryKey<{
    apps: DeveloperApp[]
  }>
}

export const useDeveloperApps = <TResult = { apps: DeveloperApp[] }>(
  userId: Nullable<ID>,
  options?: SelectableQueryOptions<{ apps: DeveloperApp[] }, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getDeveloperAppsQueryKey(userId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.users.getDeveloperApps({
        id: Id.parse(userId)
      })

      return {
        apps: data.map(
          ({ address, name, description, imageUrl }): DeveloperApp => ({
            name,
            description,
            imageUrl,
            apiKey: address.slice(2)
          })
        )
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!userId
  })
}
