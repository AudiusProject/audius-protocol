import React from 'react'
import { useSelector } from 'react-redux'

import { getIsOpen } from './store/selectors'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'

import Drawer from 'components/drawer/Drawer'
import styles from './MobileUploadDrawer.module.css'
import { ReactComponent as IconUpload } from 'assets/img/iconGradientUpload.svg'

const messages = {
  start: 'Start Uploading',
  visit: 'Visit audius.co from a desktop browser',
  unlimited: 'Unlimited Uploads',
  exclusive: 'Exclusive Content',
  clear: 'Crystal Clear 320kbps'
}

const MobileUploadDrawer = ({ onClose }: { onClose: () => void }) => {
  const isOpen = useSelector(getIsOpen)
  const keyboardVisible = useSelector(getKeyboardVisibility)
  return (
    <Drawer isOpen={isOpen} keyboardVisible={keyboardVisible} onClose={onClose}>
      <div className={styles.drawer}>
        <div className={styles.top}>
          <div className={styles.cta}>
            <IconUpload className={styles.iconUpload} />
            <div>{messages.start}</div>
          </div>
          <div className={styles.visit}>{messages.visit}</div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.action}>
            <i className='emoji large white-heavy-check-mark' />
            {messages.unlimited}
          </div>
          <div className={styles.action}>
            <i className='emoji large white-heavy-check-mark' />
            {messages.clear}
          </div>
          <div className={styles.action}>
            <i className='emoji large white-heavy-check-mark' />
            {messages.exclusive}
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export default MobileUploadDrawer
