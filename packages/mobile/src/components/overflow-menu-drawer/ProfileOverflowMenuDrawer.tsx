import { useFollowUser, useUnfollowUser, useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { ShareSource, FollowSource } from '@audius/common/models'
import type { OverflowActionCallbacks } from '@audius/common/store'
import {
  mobileOverflowMenuUISelectors,
  shareModalUIActions,
  OverflowAction
} from '@audius/common/store'
import { pick } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const ProfileOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const { id: modalId } = useSelector(getMobileOverflowModal)
  const id = modalId as ID
  const { data: partialUser } = useUser(id, {
    select: (user) => pick(user, 'handle', 'name')
  })
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  const { handle, name } = partialUser ?? {}

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
