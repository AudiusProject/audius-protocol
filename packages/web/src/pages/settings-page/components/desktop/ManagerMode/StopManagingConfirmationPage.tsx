import { useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'

import { useSelector } from 'common/hooks/useSelector'

import { RemoveManagerConfirmationContent } from './RemoveManagerConfirmationContent'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'

const { getUserId } = accountSelectors

type StopManagingConfirmationPageProps = AccountsYouManagePageProps

const messages = {
  stopManagingConfirmation:
    'Are you sure you want to stop managing this account?'
}

export const StopManagingConfirmationPage = (
  props: StopManagingConfirmationPageProps
) => {
  const { params, setPageState } = props
  const managerUserId = useSelector(getUserId)
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
