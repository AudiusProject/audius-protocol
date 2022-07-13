import { Component } from 'react'

import { Button, ButtonType } from '@audius/stems'
import Tooltip from 'antd/lib/tooltip'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { Utils } from 'services/AudiusBackend'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

import styles from './MetaMaskModal.module.css'

const WEB3_NETWORK_ID = process.env.REACT_APP_WEB3_NETWORK_ID

const messages = {
  title: '    Are You Sure You Want To Continue With MetaMask?   ',
  subHeader: '(not recommended)',
  body1:
    'Creating an Audius account with MetaMask will negatively impact your Audius experience in a significant way. We strongly suggest creating your account with an email and password.',
  body2:
    'To continue with MetaMask, please follow our advanced configuration guide.',
  metaMaskGuide: 'Read MetaMask Configuration Guide',
  continueOption: 'Yes, I Understand',
  stopOption: 'No, Take Me Back',
  metaMaskConfigure: 'Configure MetaMask to continue'
}

class MetaMaskModal extends Component {
  state = {
    checkWeb3ConfigInterval: null,
    configured: false
  }

  componentDidMount() {
    const checkWeb3ConfigInterval = setInterval(async () => {
      try {
        await waitForLibsInit()
        const configured = await Utils.configureWeb3(
          window.web3.currentProvider,
          WEB3_NETWORK_ID
        )
        if (configured) {
          this.setState({ configured: true })
          this.clearCheckConfigureWeb3()
        }
      } catch (err) {
        this.setState({ configured: false })
      }
    }, 500)
    this.setState({ checkWeb3ConfigInterval })
  }

  componentWillUnmount() {
    this.clearCheckConfigureWeb3()
  }

  clearCheckConfigureWeb3 = () => {
    if (this.state.checkWeb3ConfigInterval)
      clearInterval(this.state.checkWeb3ConfigInterval)
  }

  onClickContinue = () => {
    if (this.state.configured) {
      this.props.onClickContinue()
      this.props.onClickBack()
    }
  }

  onModalClick = (e) => {
    e.stopPropagation()
  }

  onContainerClick = (e) => {
    this.props.onClickBack()
  }

  render() {
    const { open, onClickReadConfig, onClickBack } = this.props
    const { configured } = this.state
    return (
      <div
        className={cn(styles.container, { [styles.hidden]: !open })}
        onClick={this.onContainerClick}>
        <div className={styles.modal} onClick={this.onModalClick}>
          <div className={styles.header}>
            <div className={styles.title}>
              <i className='emoji large police-cars-revolving-light' />
              {messages.title}
              <i className='emoji large police-cars-revolving-light' />
            </div>
            <div className={styles.sub}>{messages.subHeader}</div>
          </div>
          <div className={styles.bodyContainer}>
            <div className={styles.bodyText}>{messages.body1}</div>
            <div className={styles.bodyText}>{messages.body2}</div>
          </div>
          <div className={styles.guideContainer}>
            <Button
              text={messages.metaMaskGuide}
              onClick={onClickReadConfig}
              textClassName={styles.guideButtonText}
              className={styles.guideButton}
            />
          </div>
          <div className={styles.actionContainer}>
            <Tooltip
              placement='top'
              overlayClassName={cn(styles.configOverlay, {
                [styles.hidden]: configured
              })}
              title={
                <span className={styles.configMetaMask}>
                  {messages.metaMaskConfigure}
                </span>
              }
              getPopupContainer={(trigger) => trigger.parentNode}>
              <div>
                <Button
                  type={configured ? ButtonType.COMMON : ButtonType.DISABLED}
                  text={messages.continueOption}
                  onClick={this.onClickContinue}
                  textClassName={styles.actionButtonText}
                  className={cn(styles.actionButton, {
                    [styles.continueButton]: configured
                  })}
                />
              </div>
            </Tooltip>
            <Button
              type={ButtonType.PRIMARY_ALT}
              text={messages.stopOption}
              onClick={onClickBack}
              textClassName={styles.actionButtonText}
              className={cn(styles.actionButton, styles.stopButton)}
            />
          </div>
        </div>
      </div>
    )
  }
}

MetaMaskModal.propTypes = {
  configured: PropTypes.bool,
  onClickReadConfig: PropTypes.func,
  onClickBack: PropTypes.func,
  onClickContinue: PropTypes.func,
  open: PropTypes.bool
}

MetaMaskModal.defaultProps = {
  open: false,
  configured: false
}

export default MetaMaskModal
