import { useSelector } from 'react-redux'

import {
  SelectableQueryOptions,
  combineQueryStatuses,
  useUser,
  useUserByHandle
} from '~/api'
import { User } from '~/models'
import {
  getProfileUserHandle,
  getProfileUserId
} from '~/store/pages/profile/selectors'

export const useProfileUser = <TResult = User>(
  options?: SelectableQueryOptions<User, TResult>
) => {
  const profileUserId = useSelector(getProfileUserId)
  const profileUserHandle = useSelector(getProfileUserHandle)
  const userByHandleQueryData = useUserByHandle(profileUserHandle, {
    enabled: !profileUserId,
    ...options
  })
  const { data: profileUserByHandle } = userByHandleQueryData
  const userByIdQueryData = useUser<TResult>(profileUserId, options)
  const { data: profileUserById } = userByIdQueryData
  const { status } = combineQueryStatuses([
    userByHandleQueryData,
    userByIdQueryData
  ])
  return {
    user: profileUserId ? profileUserById : profileUserByHandle,
    status
  }
}
