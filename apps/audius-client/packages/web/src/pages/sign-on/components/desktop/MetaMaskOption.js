import React, { Component } from 'react'

import { Button, ButtonType } from '@audius/stems'
import PropTypes from 'prop-types'

import { ReactComponent as LogoMetaMask } from 'assets/img/logoMetaMask.svg'

import styles from './MetaMaskOption.module.css'

const MetaMaskSignupText = props => {
  return (
    <span className={styles.metaMaskSignupText}>
      {props.text} <LogoMetaMask className={styles.metaMaskLogo} />
    </span>
  )
}

export class MetaMaskOption extends Component {
  render() {
    return (
      <>
        <Button
          text={<MetaMaskSignupText text={this.props.text} />}
          onClick={this.props.onClick}
          type={ButtonType.COMMON_ALT}
          className={styles.metaMaskSignupButton}
        />
        {this.props.subText && (
          <div className={styles.subText}>({this.props.subText})</div>
        )}
      </>
    )
  }
}
MetaMaskOption.propTypes = {
  text: PropTypes.string,
  subText: PropTypes.string
}
