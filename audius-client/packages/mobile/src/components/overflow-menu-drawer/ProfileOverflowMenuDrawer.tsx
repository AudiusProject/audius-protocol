import type { ID } from '@audius/common'
import { FollowSource, ShareSource } from '@audius/common'
import type { CommonState } from 'audius-client/src/common/store'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import {
  followUser,
  unfollowUser,
  shareUser
} from 'audius-client/src/common/store/social/users/actions'
import { getMobileOverflowModal } from 'audius-client/src/common/store/ui/mobile-overflow-menu/selectors'
import type { OverflowActionCallbacks } from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { OverflowAction } from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

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
