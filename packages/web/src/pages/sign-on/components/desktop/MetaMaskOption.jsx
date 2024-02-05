import { Component } from 'react'

import { IconMetamask as LogoMetaMask } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './MetaMaskOption.module.css'

const MetaMaskSignupText = (props) => {
  return (
    <span
      className={cn(styles.metaMaskSignupText, {
        [styles.unsetWidth]: !props.text
      })}
    >
      {props.text} <LogoMetaMask className={styles.metaMaskLogo} />
    </span>
  )
}

export class MetaMaskOption extends Component {
  render() {
    return (
      <>
        <Button
          buttonType='button'
          text={<MetaMaskSignupText text={this.props.text} />}
          onClick={this.props.onClick}
          type={ButtonType.COMMON_ALT}
          fullWidth={this.props.fullWidth}
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
  subText: PropTypes.string,
  fullWidth: PropTypes.bool
}
