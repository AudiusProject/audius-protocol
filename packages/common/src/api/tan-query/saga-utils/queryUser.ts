import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getContext } from '~/store/effects'

import { getUserQueryKey } from '../useUser'
import { getUserByHandleQueryKey } from '../useUserByHandle'

export function* queryUser(id: ID | null | undefined) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData<User>(getUserQueryKey(id))
}

export function* queryUserByHandle(handle: string | null | undefined) {
  if (!handle) return null
  const queryClient = yield* getContext('queryClient')
  const id = queryClient.getQueryData<ID>(getUserByHandleQueryKey(handle))
  if (!id) return null
  return yield* queryUser(id)
}
