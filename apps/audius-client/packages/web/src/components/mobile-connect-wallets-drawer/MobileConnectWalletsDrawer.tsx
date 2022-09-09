import { useModalState } from 'common/hooks/useModalState'
import Drawer from 'components/drawer/Drawer'

import styles from './MobileConnectWalletsDrawer.module.css'

const messages = {
  title: 'Connect Wallets',
  visit:
    'To connect additional wallets please visit audius.co from a desktop browser'
}

const MobileConnectWalletsDrawer = ({ onClose }: { onClose: () => void }) => {
  const [isOpen] = useModalState('MobileConnectWalletsDrawer')

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
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
