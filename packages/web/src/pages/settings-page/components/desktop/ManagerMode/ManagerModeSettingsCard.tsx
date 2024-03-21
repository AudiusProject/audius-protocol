import { useState, useCallback } from 'react'

import { Button, IconEmbed } from '@audius/harmony'

import SettingsCard from '../SettingsCard'

import { ManagerModeSettingsModal } from './ManagerModeSettingsModal'

const messages = {
  title: 'Manager Mode',
  description:
    'Allow another Audius user to interact with your account on your behalf.',
  buttonText: 'Add Manager'
}

export const ManagerModeSettingsCard = () => {
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
        icon={<IconEmbed />}
        title={messages.title}
        description={messages.description}
      >
        <Button variant='common' onClick={handleOpen} fullWidth>
          {messages.buttonText}
        </Button>
      </SettingsCard>
      <ManagerModeSettingsModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  )
}
