import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloneDeep } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'

import { DeveloperApp } from '../developerApps'

import { QUERY_KEYS } from './queryKeys'

type UseRemoveAuthorizedAppArgs = {
  apiKey: string
  userId: ID
}

export const useRemoveAuthorizedApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: UseRemoveAuthorizedAppArgs) => {
      const { apiKey, userId } = args
      const encodedUserId = Id.parse(userId)
      const sdk = await audiusSdk()

      await sdk.grants.revokeGrant({
        userId: encodedUserId,
        appApiKey: apiKey
      })
    },
    onMutate: (args) => {
      const { apiKey, userId } = args

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.authorizedApps, args.userId]
      })

      const previousApps: DeveloperApp[] | undefined = queryClient.getQueryData(
        [QUERY_KEYS.authorizedApps, userId]
      )

      if (previousApps === undefined) {
        return {
          previousApps: []
        }
      }

      // Splice out the removed app
      const appIndex = previousApps?.findIndex((app) => app.apiKey === apiKey)
      const newApps = cloneDeep(previousApps).splice(appIndex, 1)

      queryClient.setQueryData([QUERY_KEYS.authorizedApps, userId], newApps)

      // Return context with the previous apps
      return { previousApps }
    },
    onError: (_error, args, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.authorizedApps, args.userId],
        context?.previousApps
      )
    }
  })
}
