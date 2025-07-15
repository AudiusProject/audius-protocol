import { ID } from '~/models/Identifiers'
import { UserMetadata } from '~/models/User'

import { SelectableQueryOptions } from '../types'

import { useUser } from './useUser'
import { useUserByHandle } from './useUserByHandle'

type UserParams = { id?: ID } | { handle?: string | null }

/**
 * Hook that returns user data given either a user ID or handle.
 * Uses useUser and useUserByHandle internally to maintain consistent caching behavior.
 * @param params The user params - either {id} or {handle}
 * @param options Optional configuration for the query
 * @returns The user data or null if not found
 */
export const useUserByParams = <
  TResult extends Partial<UserMetadata> = UserMetadata
>(
  params: UserParams,
  options?: SelectableQueryOptions<UserMetadata, TResult>
) => {
  const userId = 'id' in params ? params.id : null
  const handle = 'handle' in params ? params.handle : null

  const idQuery = useUser(userId, options)
  const handleQuery = useUserByHandle(handle, options)

  const query = userId ? idQuery : handleQuery

  return query
}
