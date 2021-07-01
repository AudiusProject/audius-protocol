import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import Banner from 'components/banner/Banner'

import styles from './FanburstBanner.module.css'

const messages = {
  home: `Audius is the new home of Fanburst!`,
  stream: `Upload and Stream HQ Audio at 320kbps for FREE!`,
  mobileHome: `Audius is the new home of Fanburst!`,
  mobileStream: `HQ Audio at 320kbps for FREE!`
}

const FanburstBanner = props => {
  return (
    <Banner
      {...props}
      className={cn(styles.banner, { [styles.isMobile]: props.isMobile })}
    >
      <div className={styles.text}>
        <span>
          {props.isMboile ? messages.mobileHome : messages.home}
          <span className={styles.starEyes}>
            <i className='emoji grinning-face-with-star-eyes' />
          </span>
        </span>
        <span>{props.isMobile ? messages.mobileStream : messages.stream}</span>
      </div>
    </Banner>
  )
}
FanburstBanner.propTypes = {
  isMobile: PropTypes.bool,
  onClose: PropTypes.func
}

export default FanburstBanner
