import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getContext } from '~/store/effects'

import { QUERY_KEYS } from '../queryKeys'
import { getUserQueryKey } from '../useUser'
import { getUserByHandleQueryKey } from '../useUserByHandle'

export function* queryUser(id: ID | null | undefined) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData(getUserQueryKey(id))
}

export function* queryUserByHandle(handle: string | null | undefined) {
  if (!handle) return null
  const queryClient = yield* getContext('queryClient')
  const id = queryClient.getQueryData(getUserByHandleQueryKey(handle))
  if (!id) return null
  return yield* queryUser(id)
}

export function* queryUsers(ids: ID[]) {
  const queryClient = yield* getContext('queryClient')

  return ids.reduce(
    (acc, id) => {
      const user = queryClient.getQueryData(getUserQueryKey(id))
      if (user) {
        acc[id] = user
      }
      return acc
    },
    {} as Record<ID, User>
  )
}

export function* queryAllUsers() {
  const queryClient = yield* getContext('queryClient')
  const queries = queryClient.getQueriesData<User>({
    queryKey: [QUERY_KEYS.user]
  })
  return queries.reduce(
    (acc, [_, user]) => {
      if (user?.user_id) {
        acc[user.user_id] = user
      }
      return acc
    },
    {} as Record<ID, User>
  )
}
