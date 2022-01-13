import React, { Component } from 'react'

import {
  Button,
  ButtonType,
  ButtonSize,
  IconFollow,
  IconUpload
} from '@audius/stems'
import Spin from 'antd/lib/spin'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './NavButton.module.css'

class NavButton extends Component {
  render() {
    const { status, onCreateAccount, onUpload } = this.props

    let button
    switch (status) {
      case 'signedOut':
        button = (
          <Button
            className={cn(styles.navButton, styles.createAccount)}
            textClassName={styles.navButtonText}
            iconClassName={styles.navButtonIcon}
            type={ButtonType.PRIMARY_ALT}
            size={ButtonSize.SMALL}
            text='SIGN UP'
            leftIcon={<IconFollow />}
            onClick={onCreateAccount}
          />
        )
        break
      case 'signedIn':
        button = (
          <Button
            className={cn(styles.navButton, styles.upload)}
            textClassName={styles.navButtonText}
            iconClassName={styles.navButtonIcon}
            type={ButtonType.COMMON}
            size={ButtonSize.SMALL}
            text='Upload Track'
            leftIcon={<IconUpload />}
            onClick={onUpload}
          />
        )
        break
      case 'uploading':
        button = (
          <Button
            className={cn(styles.navButton, styles.upload)}
            textClassName={styles.navButtonText}
            iconClassName={styles.navButtonIcon}
            type={ButtonType.COMMON_ALT}
            size={ButtonSize.SMALL}
            text='Uploading...'
            leftIcon={<Spin className={styles.spinner} />}
            onClick={onUpload}
          />
        )
        break
      case 'loading':
        button = null
        break
      default:
        button = (
          <Button
            className={cn(styles.navButton, styles.createAccount)}
            textClassName={styles.navButtonText}
            iconClassName={styles.navButtonIcon}
            type={ButtonType.PRIMARY_ALT}
            size={ButtonSize.SMALL}
            text='SIGN UP'
            leftIcon={<IconFollow />}
            onClick={onCreateAccount}
          />
        )
    }

    return button
  }
}

NavButton.propTypes = {
  status: PropTypes.oneOf(['uploading', 'signedIn', 'signedOut', 'loading']),
  onCreateAccount: PropTypes.func,
  onUpload: PropTypes.func
}

NavButton.defaultProps = {
  status: 'loading',
  onCreateAccount: () => {},
  onUpload: () => {}
}

export default NavButton
