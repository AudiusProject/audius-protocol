import { Id } from '@audius/sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { CollectiblesMetadata, ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'
import { entityCacheOptions } from '../utils/entityCacheOptions'

export type GetUserCollectiblesArgs = {
  userId: ID | null | undefined
}

export const getUserCollectiblesQueryKey = ({
  userId
}: GetUserCollectiblesArgs) => {
  return [
    QUERY_KEYS.userCollectibles,
    userId
  ] as unknown as QueryKey<CollectiblesMetadata>
}

/** Returns the user's known/ordered collectibles list if they have been set */
export const useUserCollectibles = (
  args: GetUserCollectiblesArgs,
  options?: QueryOptions
) => {
  const { userId } = args
  const context = useQueryContext()
  const { audiusSdk } = context

  const queryResult = useQuery({
    queryKey: getUserCollectiblesQueryKey({ userId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.users.getUserCollectibles({
        id: Id.parse(userId)
      })
      return (data?.data as CollectiblesMetadata) ?? null
    },
    ...options,
    ...entityCacheOptions,
    enabled: options?.enabled !== false && !!args.userId
  })

  return queryResult
}

export type UpdateUserCollectiblesParams = {
  userId: ID
  collectibles: CollectiblesMetadata
}

type MutationContext = {
  previousCollectibles: CollectiblesMetadata | undefined
}

export const useUpdateUserCollectibles = () => {
  const context = useQueryContext()
  const queryClient = useQueryClient()
  const { audiusSdk } = context

  return useMutation({
    mutationFn: async ({
      userId,
      collectibles
    }: UpdateUserCollectiblesParams) => {
      const sdk = await audiusSdk()
      const response = await sdk.users.updateCollectibles({
        userId: Id.parse(userId),
        collectibles
      })
      return response
    },
    onMutate: async ({
      userId,
      collectibles
    }: UpdateUserCollectiblesParams) => {
      const queryKey = getUserCollectiblesQueryKey({ userId })
      await queryClient.cancelQueries({
        queryKey
      })

      const previousCollectibles = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, collectibles)

      return { previousCollectibles }
    },
    onError: (_err, { userId }, context?: MutationContext) => {
      if (context) {
        queryClient.setQueryData(
          getUserCollectiblesQueryKey({ userId }),
          context.previousCollectibles
        )
      }
    }
  })
}
