import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { Kind } from '~/models'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { batchSetQueriesEntries } from './batchSetQueriesEntries'

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
  const entries = collectUserEntries(users)
  dispatch(addEntries(entries, forceReplace, undefined, 'react-query'))
  batchSetQueriesEntries({ entries, queryClient })
}

export const collectUserEntries = (users: User[]): EntriesByKind => {
  return {
    [Kind.USERS]: Object.fromEntries(users.map((user) => [user.user_id, user]))
  }
}
