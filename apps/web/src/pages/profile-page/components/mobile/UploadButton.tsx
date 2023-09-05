import { useCallback } from 'react'

import { modalsActions } from '@audius/common'
import { Button, ButtonType, IconUpload } from '@audius/stems'
import { useDispatch } from 'react-redux'

import MobileUploadDrawer from 'components/mobile-upload-drawer/MobileUploadDrawer'

import styles from './UploadButton.module.css'
const { setVisibility } = modalsActions

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
