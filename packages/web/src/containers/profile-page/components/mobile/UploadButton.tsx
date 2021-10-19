import React, { useCallback } from 'react'

import { Button, ButtonType, IconUpload } from '@audius/stems'
import { useDispatch } from 'react-redux'

import {
  show as showUploadDrawer,
  hide as hideUploadDrawer
} from 'common/store/ui/mobile-upload-drawer/slice'
import MobileUploadDrawer from 'containers/mobile-upload-drawer/MobileUploadDrawer'

import styles from './UploadButton.module.css'

const UploadButton = () => {
  const dispatch = useDispatch()
  const onClickUpload = useCallback(() => {
    dispatch(showUploadDrawer())
  }, [dispatch])
  const onCloseUpload = useCallback(() => {
    dispatch(hideUploadDrawer())
  }, [dispatch])

  return (
    <>
      <div className={styles.buttonContainer}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          onClick={onClickUpload}
          text='Upload Track'
          type={ButtonType.COMMON_ALT}
          leftIcon={<IconUpload />}
          iconClassName={styles.icon}
        />
      </div>
      <MobileUploadDrawer onClose={onCloseUpload} />
    </>
  )
}

export default UploadButton
