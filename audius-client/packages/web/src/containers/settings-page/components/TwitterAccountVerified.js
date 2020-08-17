import React, { Component } from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import Toast from 'components/toast/Toast'
import styles from './TwitterAccountVerified.module.css'
import TwitterAuthButton from 'components/general/TwitterAuthButton'

const TwitterText = () => (
  <div className={styles.twitterTextContainer}>
    <div>
      Your Twitter account is not verified!{' '}
      <i className='emoji slightly-frowning-face' />
    </div>
    <div>Try again once you have been verified on Twitter</div>
  </div>
)

const TWITTER_ERROR_MESSAGE_TIMEOUT = 5000

export class AccountVerified extends Component {
  state = { twitterTryAgain: false, twitterTimeout: null }

  onTwitterLoginSuccess = async twitterProfile => {
    const { uuid, profile } = await twitterProfile.json()
    this.props.onTwitterLogin(uuid, profile)
    this.props.onTwitterCompleteOauth(profile.verified)
    if (!profile.verified) {
      this.onTwitterLoginFailure()
    }
  }

  onTwitterLoginFailure = () => {
    this.setState({ twitterTryAgain: true })
    const twitterTimeout = setInterval(() => {
      this.setState({ twitterTryAgain: false })
    }, TWITTER_ERROR_MESSAGE_TIMEOUT)
    this.setState({ twitterTimeout })
  }

  componentWillUnmount = () => {
    if (this.state.twitterTimeout) {
      clearTimeout(this.state.twitterTimeout)
    }
  }

  render() {
    const { isVerified, isMobile, onTwitterClick } = this.props
    const { twitterTryAgain } = this.state
    return (
      <Toast
        text={<TwitterText />}
        open={twitterTryAgain}
        useCaret={!isMobile}
        placement={isMobile ? 'top' : 'right'}
        fillParent={isMobile}
        overlayClassName={cn(styles.twitterToastOverlay, {
          [styles.isMobile]: isMobile
        })}
      >
        <TwitterAuthButton
          isMobile={isMobile}
          className={styles.twitterButton}
          textLabel={isVerified ? 'Verified' : 'Verify'}
          disabled={isVerified}
          onClick={onTwitterClick}
          onSuccess={this.onTwitterLoginSuccess}
          onFailure={this.onTwitterLoginFailure}
        />
      </Toast>
    )
  }
}

AccountVerified.propTypes = {
  isVerified: PropTypes.bool,
  onTwitterCompleteOauth: PropTypes.func,
  onTwitterClick: PropTypes.func,
  onTwitterLogin: PropTypes.func,
  isMobile: PropTypes.bool
}

AccountVerified.defaultProps = {
  isVerified: false
}

export default AccountVerified
