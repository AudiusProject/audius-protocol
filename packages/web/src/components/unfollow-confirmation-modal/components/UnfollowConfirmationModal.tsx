import { useUnfollowUser } from '@audius/common/api'
import { FollowSource, ID } from '@audius/common/models'

import ActionSheetModal from 'components/action-drawer/ActionDrawer'
type UnfollowConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  userId: ID
}

const messages = {
  unfollow: 'Unfollow',
  cancel: 'Cancel'
}

const actions = [
  { text: messages.unfollow, isDestructive: true },
  { text: messages.cancel }
]

const UnfollowConfirmationModal = ({
  isOpen,
  onClose,
  userId
}: UnfollowConfirmationModalProps) => {
  const { mutate: unfollowUser } = useUnfollowUser()
  const actionCallbacks = [
    () => {
      unfollowUser({ followeeUserId: userId, source: FollowSource.USER_LIST })
      onClose()
    },
    () => {
      onClose()
    }
  ]

  const didSelectRow = (row: number) => {
    actionCallbacks[row]()
  }

  return (
    <ActionSheetModal
      isOpen={isOpen}
      onClose={onClose}
      actions={actions}
      didSelectRow={didSelectRow}
    />
  )
}

export default UnfollowConfirmationModal
