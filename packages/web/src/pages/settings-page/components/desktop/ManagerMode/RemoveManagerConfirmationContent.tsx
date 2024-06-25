import { useCallback, useEffect } from 'react'

import { useGetCurrentWeb3User, useRemoveManager } from '@audius/common/api'
import { useAppContext } from '@audius/common/context'
import { useAccountSwitcher } from '@audius/common/hooks'
import { Name, Status } from '@audius/common/models'
import { Button, Flex, Text } from '@audius/harmony'

const messages = {
  cancel: 'Cancel',
  remove: 'Remove',
  errorGeneral: 'Something went wrong.'
}

type RemoveManagerConfirmationContentProps = {
  confirmationMessage: string
  onSuccess: () => void
  onCancel: () => void
  userId: number
  managerUserId: number
}

export const RemoveManagerConfirmationContent = ({
  confirmationMessage,
  userId,
  managerUserId,
  onSuccess,
  onCancel
}: RemoveManagerConfirmationContentProps) => {
  const [removeManager, result] = useRemoveManager()
  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const managerIsCurrentWeb3User = currentWeb3User?.user_id === managerUserId
  const { switchToWeb3User } = useAccountSwitcher()
  const {
    analytics: { track, make }
  } = useAppContext()
  const { status } = result

  const handleDelete = useCallback(() => {
    if (!userId || !managerUserId) return
    track(
      make({
        eventName: Name.MANAGER_MODE_REMOVE_MANAGER,
        managerId: managerUserId
      })
    )
    removeManager({ userId, managerUserId })
  }, [userId, managerUserId, removeManager, make, track])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      onSuccess()
      if (managerIsCurrentWeb3User) switchToWeb3User()
    }
  }, [status, managerIsCurrentWeb3User, switchToWeb3User, onSuccess])

  if (!managerUserId) return null

  const isSubmitting = status !== Status.IDLE && status !== Status.ERROR

  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body' size='l'>
        {confirmationMessage}
      </Text>
      <Flex gap='s'>
        <Button
          variant='secondary'
          onClick={onCancel}
          disabled={isSubmitting}
          fullWidth
        >
          {messages.cancel}
        </Button>
        <Button
          variant='destructive'
          fullWidth
          onClick={handleDelete}
          isLoading={isSubmitting}
        >
          {messages.remove}
        </Button>
      </Flex>
      {status !== Status.ERROR ? null : (
        <Text textAlign='center' color='danger' variant='body'>
          {messages.errorGeneral}
        </Text>
      )}
    </Flex>
  )
}
