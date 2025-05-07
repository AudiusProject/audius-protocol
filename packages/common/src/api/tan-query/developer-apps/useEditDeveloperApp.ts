import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { DeveloperApp, EditAppPayload } from './developerApps'
import { getDeveloperAppsQueryKey } from './useDeveloperApps'

export const useEditDeveloperApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (editApp: EditAppPayload) => {
      const { name, description, imageUrl, userId, apiKey } = editApp
      const encodedUserId = Id.parse(userId)
      const sdk = await audiusSdk()

      await sdk.developerApps.updateDeveloperApp({
        appApiKey: apiKey,
        name,
        description,
        imageUrl,
        userId: encodedUserId
      })

      return { name, description, imageUrl, apiKey }
    },
    onSuccess: (editApp: DeveloperApp, editAppArgs: EditAppPayload) => {
      const { userId } = editAppArgs

      queryClient.setQueryData(
        getDeveloperAppsQueryKey(userId),
        (oldData: { apps: DeveloperApp[] } | undefined) => {
          if (!oldData) return { apps: [editApp] }
          return {
            apps: oldData.apps.map((app) =>
              app.apiKey === editApp.apiKey ? editApp : app
            )
          }
        }
      )
    }
  })
}
