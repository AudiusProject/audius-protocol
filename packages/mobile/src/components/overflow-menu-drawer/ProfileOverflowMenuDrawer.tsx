import { useFollowUser, useUnfollowUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { ShareSource, FollowSource } from '@audius/common/models'
import type { CommonState, OverflowActionCallbacks } from '@audius/common/store'
import {
  cacheUsersSelectors,
  mobileOverflowMenuUISelectors,
  shareModalUIActions,
  OverflowAction
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getUser } = cacheUsersSelectors

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const ProfileOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const { id: modalId } = useSelector(getMobileOverflowModal)
  const id = modalId as ID
  const user = useSelector((state: CommonState) => getUser(state, { id }))
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  if (!user) {
    return null
  }
  const { handle, name } = user

  if (!id || !handle || !name) {
    return null
  }

  const callbacks = {
    [OverflowAction.FOLLOW]: () =>
      followUser({ followeeUserId: id, source: FollowSource.OVERFLOW }),
    [OverflowAction.UNFOLLOW]: () =>
      unfollowUser({ followeeUserId: id, source: FollowSource.OVERFLOW }),
    [OverflowAction.SHARE]: () => {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: id,
          source: ShareSource.OVERFLOW
        })
      )
    }
  }

  return render(callbacks)
}

export default ProfileOverflowMenuDrawer
