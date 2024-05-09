import { useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'

import { useSelector } from 'common/hooks/useSelector'

import { RemoveManagerConfirmationContent } from './RemoveManagerConfirmationContent'
import { AccountsYouManagePageProps, AccountsYouManagePages } from './types'

const { getUserId } = accountSelectors

type StopManagingConfirmationPageProps = AccountsYouManagePageProps

export const StopManagingConfirmationPage = (
  props: StopManagingConfirmationPageProps
) => {
  const { params, setPage } = props
  const managerUserId = useSelector(getUserId)
  const userId = params?.user_id

  const navigateToHome = useCallback(() => {
    setPage(AccountsYouManagePages.HOME)
  }, [setPage])

  if (!managerUserId || !userId) return null

  return (
    <RemoveManagerConfirmationContent
      onCancel={navigateToHome}
      onSuccess={navigateToHome}
      userId={userId}
      managerUserId={managerUserId}
    />
  )
}
