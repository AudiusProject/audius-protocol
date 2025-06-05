import { useSelector } from 'react-redux'

import { combineQueryStatuses, useUser, useUserByHandle } from '~/api'
import {
  getProfileUserHandle,
  getProfileUserId
} from '~/store/pages/profile/selectors'

export const useProfileUser = () => {
  const profileUserId = useSelector(getProfileUserId)
  const profileUserHandle = useSelector(getProfileUserHandle)
  const userByHandleQueryData = useUserByHandle(profileUserHandle, {
    enabled: !profileUserId
  })
  const { data: profileUserByHandle } = userByHandleQueryData
  const userByIdQueryData = useUser(profileUserId)
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
