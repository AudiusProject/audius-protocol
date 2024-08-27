import { useCallback, useEffect, useState } from 'react'

import { route } from '@audius/common/utils'
import { Button, IconUserArrowRotate } from '@audius/harmony'
import { replace } from 'connected-react-router'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { doesMatchRoute } from 'utils/route'

import SettingsCard from '../SettingsCard'

import { AccountsYouManageSettingsModal } from './AccountsYouManageSettingsModal'

const { ACCOUNTS_YOU_MANAGE_SETTINGS_PAGE, SETTINGS_PAGE } = route

const messages = {
  accountsYouManageTitle: 'Accounts You Manage',
  accountsYouManageDescription:
    'Review the accounts you’re authorized to manage.',
  reviewAccountsButtonText: 'Review Accounts'
}

export const AccountsYouManageSettingsCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const isManagedAccountsRoute = doesMatchRoute(
    location,
    ACCOUNTS_YOU_MANAGE_SETTINGS_PAGE
  )

  useEffect(() => {
    if (isManagedAccountsRoute) {
      setIsModalOpen(true)
    }
  }, [isManagedAccountsRoute])

  const handleOpen = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
    if (isManagedAccountsRoute) {
      dispatch(replace(SETTINGS_PAGE))
    }
  }, [isManagedAccountsRoute, dispatch])

  return (
    <>
      <SettingsCard
        icon={<IconUserArrowRotate />}
        title={messages.accountsYouManageTitle}
        description={messages.accountsYouManageDescription}
      >
        <Button variant='secondary' onClick={handleOpen} fullWidth>
          {messages.reviewAccountsButtonText}
        </Button>
      </SettingsCard>
      <AccountsYouManageSettingsModal
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </>
  )
}
