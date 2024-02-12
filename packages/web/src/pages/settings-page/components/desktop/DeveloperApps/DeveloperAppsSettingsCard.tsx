import { useState, useCallback } from 'react'

import { IconEmbed } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'

import SettingsCard from '../SettingsCard'
import styles from '../SettingsPage.module.css'

import { DeveloperAppsSettingsModal } from './DeveloperAppsSettingsModal'

const messages = {
  title: 'Create App',
  description: 'Create your own app using the Audius API.',
  buttonText: 'Manage Your Apps'
}

export const DeveloperAppsSettingsCard = () => {
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
        <Button
          onClick={handleOpen}
          className={styles.cardButton}
          textClassName={styles.settingButtonText}
          type={ButtonType.COMMON_ALT}
          text={messages.buttonText}
        />
      </SettingsCard>
      <DeveloperAppsSettingsModal isOpen={isModalOpen} onClose={handleClose} />
    </>
  )
}
