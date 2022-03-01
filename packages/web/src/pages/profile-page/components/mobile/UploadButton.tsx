import React, { useCallback } from 'react'

import { Button, ButtonType, IconUpload } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { setVisibility } from 'common/store/ui/modals/slice'
import MobileUploadDrawer from 'components/mobile-upload-drawer/MobileUploadDrawer'

import styles from './UploadButton.module.css'

const UploadButton = () => {
  const dispatch = useDispatch()

  const onClick = useCallback(() => {
    dispatch(setVisibility({ modal: 'MobileUpload', visible: true }))
  }, [dispatch])

  return (
    <>
      <div className={styles.buttonContainer}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          onClick={onClick}
          text='Upload Track'
          type={ButtonType.COMMON_ALT}
          leftIcon={<IconUpload />}
          iconClassName={styles.icon}
        />
      </div>
      <MobileUploadDrawer />
    </>
  )
}

export default UploadButton
