import { IconPlay, IconPause } from '@audius/harmony'
import PropTypes from 'prop-types'

import styles from './PreviewButton.module.css'

const PreviewButton = ({ playing = false, onClick }) => {
  return (
    <div onClick={onClick} className={styles.preview}>
      {playing ? (
        <div>
          <IconPause color='default' className={styles.previewButton} />
        </div>
      ) : (
        <div>
          <IconPlay color='default' className={styles.previewButton} />
        </div>
      )}
      <span>Preview</span>
    </div>
  )
}

PreviewButton.propTypes = {
  playing: PropTypes.bool,
  onClick: PropTypes.func
}

export default PreviewButton
