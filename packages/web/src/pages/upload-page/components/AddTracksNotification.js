import { memo } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './AddTracksNotification.module.css'

const messages = {
  notice: 'Add more tracks to create an album or a playlist!',
  dismiss: 'Got it!'
}

const AddTracksNotification = (props) => {
  return (
    <div
      className={cn(styles.container, {
        [props.className]: !!props.className,
        [styles.hidden]: !props.show
      })}
    >
      <div className={styles.notice}>{messages.notice}</div>
      <div className={styles.dismiss} onClick={props.onDismiss}>
        {messages.dismiss}
      </div>
    </div>
  )
}

AddTracksNotification.propTypes = {
  className: PropTypes.string,
  onDismiss: PropTypes.func,
  show: PropTypes.bool
}

export default memo(AddTracksNotification)
