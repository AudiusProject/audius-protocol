import React from 'react'

import PropTypes from 'prop-types'

import { ReactComponent as IconArrow } from 'assets/img/iconArrowGrey.svg'
import Banner from 'components/banner/Banner'
import Pill from 'components/general/Pill'

import styles from './UpdateAppBanner.module.css'

const UpdateAppBanner = props => {
  return (
    <Banner {...props} isElectron>
      <div className={styles.updateAppBanner} onClick={props.onAccept}>
        <div className={styles.content}>
          <div className={styles.contentSelection}>
            <span className={styles.celebration}>
              <i className='emoji sparkles' />
            </span>
            <div className={styles.text}>A New Version Is Available</div>
            <IconArrow className={styles.arrow} />
          </div>
          <Pill
            text='Close and update'
            className={styles.pill}
            textClassName={styles.pillText}
            showIcon={false}
            clickable={false}
          />
        </div>
      </div>
    </Banner>
  )
}
UpdateAppBanner.propTypes = {
  onAccept: PropTypes.func,
  onClose: PropTypes.func
}

export default UpdateAppBanner
