import { useState, useCallback } from 'react'

import { Button, IconShieldUser } from '@audius/harmony'

import SettingsCard from '../SettingsCard'

import { AccountsManagingYouSettingsModal } from './AccountsManagingYouSettingsModal'

const messages = {
  accountsManagingYouTitle: 'Accounts Managing You',
  accountsManagingYouDescription:
    'Invite other Audius users to make changes to your account on your behalf.',
  reviewManagersButtonText: 'Review Managers'
}

export const AccountsManagingYouSettingsCard = () => {
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
        icon={<IconShieldUser />}
        title={messages.accountsManagingYouTitle}
        description={messages.accountsManagingYouDescription}
      >
        <Button variant='secondary' onClick={handleOpen} fullWidth>
          {messages.reviewManagersButtonText}
        </Button>
      </SettingsCard>
      <AccountsManagingYouSettingsModal
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </>
  )
}
