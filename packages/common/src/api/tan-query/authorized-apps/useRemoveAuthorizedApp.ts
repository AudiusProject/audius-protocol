import { AuthorizedApp, Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloneDeep } from 'lodash'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'

import { DeveloperApp } from '../developer-apps/developerApps'
import { QUERY_KEYS } from '../queryKeys'
import { QueryKey } from '../types'

export type UseRemoveAuthorizedAppArgs = {
  address: string
  userId: ID
}

export const getRemoveAuthorizedAppQueryKey = (userId: ID) => {
  return [QUERY_KEYS.authorizedApps, userId] as unknown as QueryKey<
    AuthorizedApp[]
  >
}

export const useRemoveAuthorizedApp = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: UseRemoveAuthorizedAppArgs) => {
      const { address, userId } = args
      const sdk = await audiusSdk()

      await sdk.grants.revokeGrant({
        userId: Id.parse(userId),
        appApiKey: address.slice(2)
      })
    },
    onMutate: (args) => {
      const { address: apiKey, userId } = args

      queryClient.invalidateQueries({
        queryKey: getRemoveAuthorizedAppQueryKey(userId)
      })

      const previousApps: AuthorizedApp[] | undefined =
        queryClient.getQueryData(getRemoveAuthorizedAppQueryKey(userId))

      if (previousApps === undefined) {
        return {
          previousApps: []
        }
      }

      // Splice out the removed app
      const appIndex = previousApps?.findIndex((app) => app.address === apiKey)
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
