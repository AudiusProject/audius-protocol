import React from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Transition } from 'react-spring/renderprops'

import styles from './TwitterOverlay.module.css'
import TwitterAuthButton from 'components/general/TwitterAuthButton'

const messages = {
  twitterButton: 'Complete With Twitter',
  reasons:
    'Quickly complete your profile by autofilling with one of your accounts. ',
  actions:
    'We will autofill your name, handle, profile picture, cover photo, location, and verification.  You won’t use this to log-in, and Audius will never post on your behalf.',
  manual: 'I’d rather fill out my profile manually'
}

const TwitterOverlay = props => {
  return (
    <Transition
      items={props.showTwitterOverlay}
      from={{ opacity: props.initial ? 1 : 0 }}
      enter={{ opacity: 1 }}
      leave={{ opacity: 0 }}
      config={{ duration: 100 }}
    >
      {show =>
        show &&
        (transitionProps => (
          <div
            style={{
              ...transitionProps,
              zIndex: 10,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <div
              className={cn(styles.twitterOverlayContainer, {
                [styles.isMobile]: props.isMobile
              })}
            >
              <div className={styles.header}>{props.header}</div>
              <div className={styles.reasons}>{messages.reasons}</div>
              <TwitterAuthButton
                showIcon={false}
                className={styles.twitterButton}
                textLabel={messages.twitterButton}
                onSuccess={props.onTwitterLogin}
                onFailure={(...args) => console.log(args)}
              />
              <div className={styles.actions}>{messages.actions}</div>
              <div
                className={styles.manualText}
                onClick={props.onToggleTwitterOverlay}
              >
                {messages.manual}
              </div>
            </div>
          </div>
        ))
      }
    </Transition>
  )
}

TwitterOverlay.propTypes = {
  header: PropTypes.string,
  showTwitterOverlay: PropTypes.bool,
  initial: PropTypes.bool,
  onTwitterLogin: PropTypes.func,
  onToggleTwitterOverlay: PropTypes.func,
  isMobile: PropTypes.bool
}

TwitterOverlay.defaultProps = {
  initial: false,
  isMobile: false
}

export default TwitterOverlay
