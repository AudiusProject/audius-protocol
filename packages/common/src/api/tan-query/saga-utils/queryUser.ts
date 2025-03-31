import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'
import { getContext } from '~/store/effects'

import { getUserQueryKey } from '../useUser'

export function* queryUser(id: ID) {
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData<User>(getUserQueryKey(id))
}
