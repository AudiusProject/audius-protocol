import { Button, ButtonType } from '@audius/stems'

import Drawer from 'components/drawer/Drawer'

import styles from './RemovePlaylistTrackDrawer.module.css'

const messages = {
  title: `Are You Sure?`,
  description: (trackName: string) =>
    `Do you want to remove ${trackName} from this playlist?`,
  submit: 'Remove Track',
  cancel: 'Nevermind'
}

type RemovePlaylistTrackDrawerProps = {
  isOpen: boolean
  trackTitle?: string
  onClose: () => void
  onConfirm: () => void
}

const RemovePlaylistTrackDrawer = ({
  isOpen,
  onClose,
  trackTitle = '',
  onConfirm
}: RemovePlaylistTrackDrawerProps) => {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} shouldClose={!isOpen}>
      <div className={styles.drawer}>
        <h4 className={styles.title}>{messages.title}</h4>
        <div className={styles.description}>
          {messages.description(trackTitle)}
        </div>
        <Button
          className={styles.submit}
          type={ButtonType.PRIMARY_ALT}
          text={messages.submit}
          textClassName={styles.submitText}
          onClick={onConfirm}
        />
        <div className={styles.cancel} onClick={onClose}>
          {messages.cancel}
        </div>
      </div>
    </Drawer>
  )
}

export default RemovePlaylistTrackDrawer
