import { useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { Box } from '@audius/harmony'

import { RemoveManagerConfirmationContent } from './RemoveManagerConfirmationContent'
import {
  AccountsManagingYouPages,
  ConfirmRemoveManagerPageProps
} from './types'

type RemoveManagerConfirmationPageProps = ConfirmRemoveManagerPageProps

const messages = {
  removeManagerConfirmation:
    'Are you sure you want to remove this manager from your account?'
}

export const RemoveManagerConfirmationPage = (
  props: RemoveManagerConfirmationPageProps
) => {
  const { params, setPageState } = props
  const { data: userId } = useCurrentUserId()
  const managerUserId = params?.managerUserId

  const handleSuccess = useCallback(() => {
    setPageState({
      page: AccountsManagingYouPages.HOME,
      transitionDirection: 'forward'
    })
  }, [setPageState])

  const handleCancel = useCallback(() => {
    setPageState({
      page: AccountsManagingYouPages.HOME,
      transitionDirection: 'back'
    })
  }, [setPageState])

  if (!managerUserId || !userId) return null

  return (
    <Box ph='xl'>
      <RemoveManagerConfirmationContent
        confirmationMessage={messages.removeManagerConfirmation}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
        userId={userId}
        managerUserId={managerUserId}
      />
    </Box>
  )
}
