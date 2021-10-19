import React from 'react'

import { getModalVisibility } from 'common/store/ui/modals/slice'
import Drawer from 'components/drawer/Drawer'
import { getKeyboardVisibility } from 'store/application/ui/mobileKeyboard/selectors'
import { useSelector } from 'utils/reducer'

import styles from './MobileConnectWalletsDrawer.module.css'

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
