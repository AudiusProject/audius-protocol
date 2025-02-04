import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { getUserQueryKey } from '../useUser'
import { getUserByHandleQueryKey } from '../useUserByHandle'

export const primeUserData = ({
  users,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  users: User[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  const entries = primeUserDataInternal({ users, queryClient, skipQueryData })
  dispatch(addEntries(entries, forceReplace, undefined, 'react-query'))
}

export const primeUserDataInternal = ({
  users,
  queryClient,
  skipQueryData = false
}: {
  users: User[]
  queryClient: QueryClient
  skipQueryData?: boolean
}): EntriesByKind => {
  const entries: SetRequired<EntriesByKind, Kind.USERS> = {
    [Kind.USERS]: {}
  }

  users.forEach((user) => {
    // Prime user by ID
    if (
      !skipQueryData &&
      !queryClient.getQueryData(getUserQueryKey(user.user_id))
    ) {
      queryClient.setQueryData(getUserQueryKey(user.user_id), user)
    }
    // Prime user by handle
    if (
      !skipQueryData &&
      user.handle &&
      !queryClient.getQueryData(getUserByHandleQueryKey(user.handle))
    ) {
      queryClient.setQueryData(getUserByHandleQueryKey(user.handle), user)
    }

    entries[Kind.USERS][user.user_id] = user
  })

  return entries
}
