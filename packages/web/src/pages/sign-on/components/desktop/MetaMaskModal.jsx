import { Component } from 'react'

import { BackendUtils as Utils } from '@audius/common'
import { Box, Text } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

import styles from './MetaMaskModal.module.css'

const WEB3_NETWORK_ID = process.env.VITE_WEB3_NETWORK_ID

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
  metaMaskConfigure: 'Configure MetaMask to continue',
  configureError:
    'Your MetaMask is not properly configured. Make sure to set your network in MetaMask to the Audius network, and have at least one account in MetaMask. For more info, see the MetaMask Configuration Guide.',
  accessError:
    'You must grant Audius access to one of your MetaMask accounts in order to continue.'
}

class MetaMaskModal extends Component {
  state = {
    submitting: false,
    accessError: false,
    configureError: false
  }

  resetState = () => {
    this.setState({
      submitting: false,
      accessError: false,
      configureError: false
    })
  }

  onClickContinue = async () => {
    this.resetState()
    this.setState({ submitting: true })
    await waitForLibsInit()
    try {
      await window.ethereum?.enable()
    } catch (err) {
      this.setState({ accessError: true })
      return
    }
    try {
      const configured = await Utils.configureWeb3(
        window.web3.currentProvider,
        WEB3_NETWORK_ID,
        true
      )
      if (configured) {
        this.props.onClickContinue()
        this.props.onClickBack()
      } else {
        this.setState({ configureError: true })
      }
    } catch {
      this.setState({ configureError: true })
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
        onClick={this.onContainerClick}
      >
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
            <div>
              <Button
                type={
                  this.state.submitting
                    ? ButtonType.DISABLED
                    : ButtonType.COMMON
                }
                disabled={this.state.submitting}
                text={messages.continueOption}
                onClick={this.onClickContinue}
                textClassName={styles.actionButtonText}
                className={cn(styles.actionButton, {
                  [styles.continueButton]: configured
                })}
              />
            </div>
            <Button
              type={ButtonType.PRIMARY_ALT}
              text={messages.stopOption}
              onClick={() => {
                this.resetState()
                onClickBack()
              }}
              textClassName={styles.actionButtonText}
              className={cn(styles.actionButton, styles.stopButton)}
            />
          </div>
          {this.state.accessError || this.state.configureError ? (
            <Box mt='l'>
              <Text variant='body' color='danger'>
                {this.state.accessError
                  ? messages.accessError
                  : messages.configureError}
              </Text>
            </Box>
          ) : null}
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
