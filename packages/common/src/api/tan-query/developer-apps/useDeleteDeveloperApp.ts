import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { DeleteDeveloperAppArgs, DeveloperApp } from './developerApps'
import { getDeveloperAppsQueryKey } from './useDeveloperApps'

export const useDeleteDeveloperApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: DeleteDeveloperAppArgs) => {
      const { userId, apiKey } = args
      const encodedUserId = Id.parse(userId)
      const sdk = await audiusSdk()

      await sdk.developerApps.deleteDeveloperApp({
        userId: encodedUserId,
        appApiKey: apiKey
      })
      return {}
    },
    onSuccess: (_response, args) => {
      const { userId, apiKey } = args

      queryClient.setQueryData(
        getDeveloperAppsQueryKey(userId),
        (oldData: { apps: DeveloperApp[] } | undefined) => {
          if (!oldData) return { apps: [] }
          return {
            apps: oldData.apps.filter((app) => app.apiKey !== apiKey)
          }
        }
      )
    }
  })
}
