import React from 'react'
import { useSelector } from 'utils/reducer'

import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'

import Drawer from 'components/drawer/Drawer'
import styles from './MobileConnectWalletsDrawer.module.css'
import { getModalVisibility } from 'store/application/ui/modals/slice'

const messages = {
  title: 'Connect Wallets',
  visit:
    'To connect additional wallets please visit audius.co from a desktop browser'
}

const MobileConnectWalletsDrawer = ({ onClose }: { onClose: () => void }) => {
  const keyboardVisible = useSelector(getKeyboardVisibility)
  const isOpen = useSelector(state =>
    getModalVisibility(state, 'MobileConnectWalletsDrawer')
  )

  return (
    <Drawer isOpen={isOpen} keyboardVisible={keyboardVisible} onClose={onClose}>
      <div className={styles.drawer}>
        <div className={styles.top}>
          <div className={styles.title}>{messages.title}</div>
          <div className={styles.visit}>{messages.visit}</div>
        </div>
      </div>
    </Drawer>
  )
}

export default MobileConnectWalletsDrawer
