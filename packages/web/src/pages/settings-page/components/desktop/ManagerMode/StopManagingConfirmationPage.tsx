import { useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'

import { RemoveManagerConfirmationContent } from './RemoveManagerConfirmationContent'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'

type StopManagingConfirmationPageProps = AccountsYouManagePageProps

const messages = {
  stopManagingConfirmation:
    'Are you sure you want to stop managing this account?'
}

export const StopManagingConfirmationPage = (
  props: StopManagingConfirmationPageProps
) => {
  const { params, setPageState } = props
  const { data: managerUserId } = useCurrentUserId()
  const userId = params?.user_id

  const handleCancel = useCallback(() => {
    setPageState({
      page: AccountsYouManagePages.HOME,
      transitionDirection: 'back'
    })
  }, [setPageState])

  const handleSuccess = useCallback(() => {
    setPageState({
      page: AccountsYouManagePages.HOME,
      transitionDirection: 'forward'
    })
  }, [setPageState])

  if (!managerUserId || !userId) return null

  return (
    <RemoveManagerConfirmationContent
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      userId={userId}
      managerUserId={managerUserId}
      confirmationMessage={messages.stopManagingConfirmation}
    />
  )
}
