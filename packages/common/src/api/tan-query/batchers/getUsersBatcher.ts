import { Id, OptionalId } from '@audius/sdk'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { memoize } from 'lodash'

import { userMetadataListFromSDK } from '~/adapters/user'
import { UserMetadata } from '~/models/User'

import { primeUserData } from '../utils/primeUserData'

import { BatchContext, BatchQuery } from './types'

export const getUsersBatcher = memoize((context: BatchContext) =>
  create({
    fetcher: async (queries: BatchQuery[]): Promise<UserMetadata[]> => {
      const { sdk, currentUserId, queryClient, dispatch } = context
      if (!queries.length) return []
      const ids = queries.map((q) => q.id)
      const { data } = await sdk.full.users.getBulkUsers({
        id: ids.map((id) => Id.parse(id)),
        userId: OptionalId.parse(currentUserId)
      })

      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch, skipQueryData: true })

      return users
    },
    resolver: keyResolver('user_id'),
    scheduler: windowScheduler(10)
  })
)
