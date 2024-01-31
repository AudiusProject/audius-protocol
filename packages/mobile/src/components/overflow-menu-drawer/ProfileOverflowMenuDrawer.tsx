import {
  cacheUsersSelectors,
  usersSocialActions,
  mobileOverflowMenuUISelectors,
  shareModalUIActions,
  OverflowAction,
  CommonState,
  OverflowActionCallbacks
} from '@audius/common/store'
import type {} from '@audius/common'

import type { ID } from '@audius/common/models'
import { ShareSource, FollowSource } from '@audius/common/models'
import { useDispatch, useSelector } from 'react-redux'

const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { followUser, unfollowUser } = usersSocialActions
const { getUser } = cacheUsersSelectors

type Props = {
  render: (callbacks: OverflowActionCallbacks) => JSX.Element
}

const ProfileOverflowMenuDrawer = ({ render }: Props) => {
  const dispatch = useDispatch()
  const { id: modalId } = useSelector(getMobileOverflowModal)
  const id = modalId as ID
  const user = useSelector((state: CommonState) => getUser(state, { id }))

  if (!user) {
    return null
  }
  const { handle, name } = user

  if (!id || !handle || !name) {
    return null
  }

  const callbacks = {
    [OverflowAction.FOLLOW]: () =>
      dispatch(followUser(id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW]: () =>
      dispatch(unfollowUser(id, FollowSource.OVERFLOW)),
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
