import { useState, useCallback } from 'react'

import { Button, IconUserArrowRotate } from '@audius/harmony'

import SettingsCard from '../SettingsCard'

import { AccountsManagingYouSettingsModal } from './AccountsManagingYouSettingsModal'
import { AccountsYouManageSettingsModal } from './AccountsYouManageSettingsModal'

const messages = {
  accountsYouManageTitle: 'Accounts You Manage',
  accountsYouManageDescription:
    'Review the accounts you’re authorized to manage.',
  reviewAccountsButtonText: 'Review Accounts'
}

export const AccountsYouManageSettingsCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

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
