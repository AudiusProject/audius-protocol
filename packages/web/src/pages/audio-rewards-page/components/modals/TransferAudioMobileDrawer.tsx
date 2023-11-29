import IconGold from 'assets/img/IconGoldBadge.svg'
import { useModalState } from 'common/hooks/useModalState'
import Drawer from 'components/drawer/Drawer'

import styles from './TransferAudioMobileDrawer.module.css'

const messages = {
  title: 'Transfer $AUDIO',
  subtitle: 'To transfer AUDIO please visit audius.co from a desktop browser'
}

const TransferAudioMobileDrawer = () => {
  const [isOpen, setOpen] = useModalState('TransferAudioMobileWarning')

  return (
    <Drawer isOpen={isOpen} onClose={() => setOpen(false)}>
      <div className={styles.container}>
        <IconGold />
        <span className={styles.title}>{messages.title}</span>
        <span className={styles.subtitle}>{messages.subtitle}</span>
      </div>
    </Drawer>
  )
}

export default TransferAudioMobileDrawer
