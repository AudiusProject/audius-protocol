import type { ID, OverflowActionCallbacks, CommonState } from '@audius/common'
import {
  FollowSource,
  ShareSource,
  cacheUsersSelectors,
  usersSocialActions,
  OverflowAction,
  mobileOverflowMenuUISelectors
} from '@audius/common'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
const { getMobileOverflowModal } = mobileOverflowMenuUISelectors
const { followUser, unfollowUser, shareUser } = usersSocialActions
const { getUser } = cacheUsersSelectors

type Props = {
  render: (callbacks: OverflowActionCallbacks) => React.ReactNode
}

const ProfileOverflowMenuDrawer = ({ render }: Props) => {
  const dispatchWeb = useDispatchWeb()
  const { id: modalId } = useSelectorWeb(getMobileOverflowModal)
  const id = modalId as ID
  const user = useSelectorWeb((state: CommonState) => getUser(state, { id }))

  if (!user) {
    return null
  }
  const { handle, name } = user

  if (!id || !handle || !name) {
    return null
  }

  const callbacks = {
    [OverflowAction.FOLLOW]: () =>
      dispatchWeb(followUser(id, FollowSource.OVERFLOW)),
    [OverflowAction.UNFOLLOW]: () =>
      dispatchWeb(unfollowUser(id, FollowSource.OVERFLOW)),
    [OverflowAction.SHARE]: () =>
      dispatchWeb(shareUser(id, ShareSource.OVERFLOW))
  }

  return render(callbacks)
}

export default ProfileOverflowMenuDrawer
