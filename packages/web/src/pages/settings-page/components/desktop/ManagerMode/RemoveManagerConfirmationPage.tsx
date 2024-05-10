import { useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'
import { Box } from '@audius/harmony'

import { useSelector } from 'common/hooks/useSelector'

import { RemoveManagerConfirmationContent } from './RemoveManagerConfirmationContent'
import {
  AccountsManagingYouPages,
  ConfirmRemoveManagerPageProps
} from './types'

const { getUserId } = accountSelectors

type RemoveManagerConfirmationPageProps = ConfirmRemoveManagerPageProps

const messages = {
  removeManagerConfirmation:
    'Are you sure you want to remove this manager from your account?'
}

export const RemoveManagerConfirmationPage = (
  props: RemoveManagerConfirmationPageProps
) => {
  const { params, setPage } = props
  const userId = useSelector(getUserId)
  const managerUserId = params?.managerUserId

  const navigateToHome = useCallback(() => {
    setPage(AccountsManagingYouPages.HOME)
  }, [setPage])

  if (!managerUserId || !userId) return null

  return (
    <Box ph='xl'>
      <RemoveManagerConfirmationContent
        confirmationMessage={messages.removeManagerConfirmation}
        onCancel={navigateToHome}
        onSuccess={navigateToHome}
        userId={userId}
        managerUserId={managerUserId}
      />
    </Box>
  )
}
