import { useCallback, useState } from 'react'

import { Button, ButtonType, IconUpload } from '@audius/stems'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'

import styles from './UploadButton.module.css'

const UploadButton = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)
  }, [setIsDrawerOpen])

  const handleClick = useCallback(() => {
    setIsDrawerOpen(true)
  }, [setIsDrawerOpen])

  return (
    <>
      <div className={styles.buttonContainer}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          onClick={handleClick}
          text='Upload Track'
          type={ButtonType.COMMON_ALT}
          leftIcon={<IconUpload />}
          iconClassName={styles.icon}
        />
      </div>
      <DownloadMobileAppDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </>
  )
}

export default UploadButton
