import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { profilePageActions } from '~/store/pages'

import { Config } from './types'
import { useUser } from './useUser'
import { useUserByHandle } from './useUserByHandle'

const { fetchProfileSucceeded } = profilePageActions

type UserParams = { userId?: ID } | { handle?: string }

/**
 * Hook that returns user data given either a user ID or handle.
 * Uses useUser and useUserByHandle internally to maintain consistent caching behavior.
 * @param params The user params - either {id} or {handle}
 * @param options Optional configuration for the query
 * @returns The user data or null if not found
 */
export const useUserByParams = (
  params: UserParams | null | undefined,
  options?: Config
) => {
  const dispatch = useDispatch()

  const idQuery = useUser(params && 'userId' in params ? params.userId : null, {
    ...options,
    enabled: options?.enabled !== false && !!params && 'userId' in params
  })

  const handleQuery = useUserByHandle(
    params && 'handle' in params ? params.handle : null,
    {
      ...options,
      enabled: options?.enabled !== false && !!params && 'handle' in params
    }
  )

  const query = 'userId' in (params ?? {}) ? idQuery : handleQuery
  const { isSuccess, data } = query
  const userId = data?.user_id

  useEffect(() => {
    if (isSuccess && userId) {
      dispatch(fetchProfileSucceeded(userId))
    }
  }, [isSuccess, userId, dispatch])

  return query
}
