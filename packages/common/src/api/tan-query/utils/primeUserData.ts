import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { Kind } from '~/models'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

export const primeUserData = ({
  user,
  queryClient,
  dispatch
}: {
  user: User
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
}) => {
  const entries = primeUserDataInternal({ user, queryClient })

  dispatch(addEntries(entries, undefined, undefined, 'react-query'))
}

export const primeUserDataInternal = ({
  user,
  queryClient
}: {
  user: User
  queryClient: QueryClient
}): EntriesByKind => {
  // Prime user by ID
  queryClient.setQueryData([QUERY_KEYS.user, user.user_id], user)
  // Prime user by handle
  if (user.handle) {
    queryClient.setQueryData([QUERY_KEYS.userByHandle, user.handle], user)
  }

  // Return entries for Redux
  return {
    [Kind.USERS]: {
      [user.user_id]: user
    }
  }
}
