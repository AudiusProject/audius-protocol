import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloneDeep } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'

import { DeveloperApp } from './developerApps'
import { QUERY_KEYS } from './queryKeys'

export type UseRemoveAuthorizedAppArgs = {
  apiKey: string
  userId: ID
}

export const getRemoveAuthorizedAppQueryKey = (userId: ID) => [
  QUERY_KEYS.authorizedApps,
  userId
]

export const useRemoveAuthorizedApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: UseRemoveAuthorizedAppArgs) => {
      const { apiKey, userId } = args
      const sdk = await audiusSdk()

      await sdk.grants.revokeGrant({
        userId: Id.parse(userId),
        appApiKey: apiKey
      })
    },
    onMutate: (args) => {
      const { apiKey, userId } = args

      queryClient.invalidateQueries({
        queryKey: getRemoveAuthorizedAppQueryKey(userId)
      })

      const previousApps: DeveloperApp[] | undefined = queryClient.getQueryData(
        getRemoveAuthorizedAppQueryKey(userId)
      )

      if (previousApps === undefined) {
        return {
          previousApps: []
        }
      }

      // Splice out the removed app
      const appIndex = previousApps?.findIndex((app) => app.apiKey === apiKey)
      const newApps = cloneDeep(previousApps).splice(appIndex, 1)

      queryClient.setQueryData(getRemoveAuthorizedAppQueryKey(userId), newApps)

      // Return context with the previous apps
      return { previousApps }
    },
    onError: (_error, args, context) => {
      queryClient.setQueryData(
        getRemoveAuthorizedAppQueryKey(args.userId),
        context?.previousApps
      )
    }
  })
}
