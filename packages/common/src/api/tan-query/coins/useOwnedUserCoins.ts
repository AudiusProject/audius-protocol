import { Id } from '@audius/sdk'
import { queryOptions, useQuery } from '@tanstack/react-query'

import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { useQueryContext, type QueryContextType } from '../utils'

export const getOwnedUserCoinsQueryKey = (
  userId?: ID | null,
  limit?: number,
  offset?: number
) => [QUERY_KEYS.userOwnedCoins, userId, { limit, offset }] as const

/**
 * Query function for fetching coins owned by a user
 */
const getOwnedUserCoinsQueryFn =
  (context: QueryContextType) =>
  async (params: { userId: ID; limit?: number; offset?: number }) => {
    const sdk = await context.audiusSdk()

    const response = await sdk.coins.getCoins({
      ownerId: [Id.parse(params.userId)],
      limit: params.limit,
      offset: params.offset
    })

    return response.data ?? []
  }

/**
 * Helper function to get the query options for fetching coins owned by a user.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
const getOwnedUserCoinsOptions = (
  context: QueryContextType,
  {
    userId,
    limit = 5,
    offset = 0
  }: { userId: ID | null | undefined; limit?: number; offset?: number }
) => {
  return queryOptions({
    queryKey: getOwnedUserCoinsQueryKey(userId, limit, offset),
    queryFn: () =>
      getOwnedUserCoinsQueryFn(context)({
        userId: userId!,
        limit,
        offset
      }),
    enabled: !!userId
  })
}

/**
 * Returns a list of coins the user has launched and is the owner for
 * @param userId
 * @param options
 * @returns
 */
export const useOwnedUserCoins = (
  params: { userId: ID | null | undefined; limit?: number; offset?: number },
  options?: Partial<ReturnType<typeof getOwnedUserCoinsOptions>>
) => {
  const context = useQueryContext()

  return useQuery({
    ...options,
    ...getOwnedUserCoinsOptions(context, params),
    enabled: options?.enabled !== false && !!params.userId
  })
}
