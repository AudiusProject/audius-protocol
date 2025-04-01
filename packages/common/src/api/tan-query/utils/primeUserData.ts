import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { TypedQueryClient } from '../typed-query-client'
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
  queryClient: TypedQueryClient
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
  forceReplace = false,
  skipQueryData = false
}: {
  users: User[]
  queryClient: TypedQueryClient
  forceReplace?: boolean
  skipQueryData?: boolean
}): EntriesByKind => {
  const entries: SetRequired<EntriesByKind, Kind.USERS> = {
    [Kind.USERS]: {}
  }

  users.forEach((user) => {
    if (
      forceReplace ||
      (!skipQueryData &&
        !queryClient.getQueryData(getUserQueryKey(user.user_id)))
    ) {
      queryClient.setQueryData(getUserQueryKey(user.user_id), user)
      // TODO: update the current user query data
    }

    if (
      forceReplace ||
      !queryClient.getQueryData(getUserByHandleQueryKey(user.handle))
    ) {
      queryClient.setQueryData(
        getUserByHandleQueryKey(user.handle),
        user.user_id
      )
    }

    entries[Kind.USERS][user.user_id] = user
  })

  return entries
}
