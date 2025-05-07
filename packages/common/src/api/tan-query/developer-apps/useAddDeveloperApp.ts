import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { DeveloperApp, NewAppPayload } from './developerApps'
import { getDeveloperAppsQueryKey } from './useDeveloperApps'

export const useAddDeveloperApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newApp: NewAppPayload) => {
      const { name, description, imageUrl, userId } = newApp
      const encodedUserId = Id.parse(userId)
      const sdk = await audiusSdk()

      const { apiKey, apiSecret } = await sdk.developerApps.createDeveloperApp({
        name,
        description,
        imageUrl,
        userId: encodedUserId
      })

      await sdk.grants.createGrant({
        userId: encodedUserId,
        appApiKey: apiKey
      })

      return { name, description, imageUrl, apiKey, apiSecret }
    },
    onSuccess: (newApp: DeveloperApp, newAppArgs: NewAppPayload) => {
      const { userId } = newAppArgs
      const { apiSecret: apiSecretIgnored, ...restNewApp } = newApp

      queryClient.setQueryData(
        getDeveloperAppsQueryKey(userId),
        (oldData: { apps: DeveloperApp[] } | undefined) => {
          if (!oldData) return { apps: [restNewApp] }
          return {
            apps: [...oldData.apps, restNewApp]
          }
        }
      )
    }
  })
}
