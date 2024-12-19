import { Component } from 'react'

import { Button, Flex, Box, Text } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import styles from './MetaMaskModal.module.css'

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
    try {
      await window.ethereum?.enable()
    } catch (err) {
      this.setState({ accessError: true })
      return
    }
    // TODO: Fix MM auth
    // https://github.com/AudiusProject/audius-protocol/pull/10392
    this.setState({ configureError: true })
  }

  onModalClick = (e) => {
    e.stopPropagation()
  }

  onContainerClick = (e) => {
    this.props.onClickBack()
  }

  render() {
    const { open, onClickReadConfig, onClickBack } = this.props
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
            <Button variant='primary' onClick={onClickReadConfig}>
              {messages.metaMaskGuide}
            </Button>
          </div>
          <Flex mt='2xl' w='100%' gap='l'>
            <Button
              variant='secondary'
              isLoading={this.state.submitting}
              onClick={this.onClickContinue}
              fullWidth
            >
              {messages.continueOption}
            </Button>
            <Button
              variant='primary'
              fullWidth
              onClick={() => {
                this.resetState()
                onClickBack()
              }}
            >
              {messages.stopOption}
            </Button>
          </Flex>
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
