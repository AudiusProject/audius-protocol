import AudiusLogoGlyph from '../../assets/img/audiusLogoGlyph.svg'
import PlayButton, { PlayingState } from '../playbutton/PlayButton'

import styles from './DeletedContentTiny.module.css'

const messages = {
  deletedBy: 'Track Deleted By Artist',
  deleted: 'Deleted'
}

const DeletedContentTiny = ({ onClick, isBlocked }) => {
  return (
    <div className={styles.wrapper}>
      <PlayButton
        playingState={PlayingState.Stopped}
        className={styles.playButton}
      />
      <div className={styles.container} onClick={onClick}>
        <div className={styles.info}>
          {isBlocked ? messages.deleted : messages.deletedBy}
        </div>
        <AudiusLogoGlyph className={styles.logo} />
      </div>
    </div>
  )
}

export default DeletedContentTiny
