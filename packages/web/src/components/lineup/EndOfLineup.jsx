import { memo } from 'react'

import { IconAudiusLogo } from '@audius/harmony'
import PropTypes from 'prop-types'

import styles from './EndOfLineup.module.css'

export const EndOfLineup = ({
  title = 'End of the line',
  description = "Looks like you've reached the end of your feed..."
}) => {
  return (
    <div className={styles.endOfLineup}>
      <IconAudiusLogo color='subdued' size='2xl' />
      <div className={styles.endTitle}>{title}</div>
      <div className={styles.endDescriptionContainer}>
        <div className={styles.divider} />
        <div className={styles.endDescription}>{description}</div>
        <div className={styles.divider} />
      </div>
    </div>
  )
}

EndOfLineup.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string
}

export default memo(EndOfLineup)
