import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

export const primeUserData = ({
  users,
  queryClient,
  dispatch,
  forceReplace = false
}: {
  users: User[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
}) => {
  const entries = primeUserDataInternal({ users, queryClient })
  dispatch(addEntries(entries, forceReplace, undefined, 'react-query'))
}

export const primeUserDataInternal = ({
  users,
  queryClient
}: {
  users: User[]
  queryClient: QueryClient
}): EntriesByKind => {
  const entries: SetRequired<EntriesByKind, Kind.USERS> = {
    [Kind.USERS]: {}
  }

  users.forEach((user) => {
    // Prime user by ID
    queryClient.setQueryData([QUERY_KEYS.user, user.user_id], user)
    // Prime user by handle
    if (user.handle) {
      queryClient.setQueryData([QUERY_KEYS.userByHandle, user.handle], user)
    }

    entries[Kind.USERS][user.user_id] = user
  })

  return entries
}
