import { useCallback, useEffect, useState } from 'react'

import { useRemoveManager } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { Button, Flex, Text } from '@audius/harmony'

const messages = {
  removeManagerConfirmation:
    'Are you sure you want to remove this manager from your account?',
  stopManagingConfirmation:
    'Are you sure you want to stop managing this account?',
  cancel: 'Cancel',
  remove: 'Remove',
  errorGeneral: 'Something went wrong.'
}

type RemoveManagerConfirmationContentProps = {
  isStopManaging?: boolean
  onSuccess: () => void
  onCancel: () => void
  userId: number
  managerUserId: number
}

export const RemoveManagerConfirmationContent = ({
  isStopManaging,
  userId,
  managerUserId,
  onSuccess,
  onCancel
}: RemoveManagerConfirmationContentProps) => {
  const [removeManager, result] = useRemoveManager()
  const [error, setError] = useState<string | null>(null)
  const { status } = result

  const handleDelete = useCallback(() => {
    if (!userId || !managerUserId) return
    removeManager({ userId, managerUserId })
  }, [userId, managerUserId, removeManager])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      onSuccess()
    }
  }, [status, onSuccess])

  useEffect(() => {
    if (status === Status.ERROR) {
      setError(messages.errorGeneral)
    }
  }, [status])

  if (!managerUserId) return null

  const isSubmitting = status !== Status.IDLE

  return (
    <Flex direction='column' gap='xl'>
      <Text variant='body' size='l'>
        {isStopManaging
          ? messages.stopManagingConfirmation
          : messages.removeManagerConfirmation}
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
      {error == null ? null : (
        <Text textAlign='center' color='danger' variant='body'>
          {error}
        </Text>
      )}
    </Flex>
  )
}
