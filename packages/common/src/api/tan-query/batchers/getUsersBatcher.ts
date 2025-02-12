import { Id, OptionalId } from '@audius/sdk'
import { QueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { Dispatch } from 'redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'
import { removeNullable } from '~/utils/typeUtils'

import { primeUserData } from '../utils/primeUserData'

import { BatchQuery } from './types'

export type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

export const getUsersBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)
    const { data } = await sdk.full.users.getBulkUsers({
      id: ids.map((id) => Id.parse(id)).filter(removeNullable),
      userId: OptionalId.parse(currentUserId)
    })

    // prime the users in the cache
    const users = userMetadataListFromSDK(data)
    primeUserData({ users, queryClient, dispatch })

    return users
  },
  resolver: keyResolver('user_id'),
  scheduler: windowScheduler(10)
})
