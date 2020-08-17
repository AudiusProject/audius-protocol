import React from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Transition } from 'react-spring/renderprops'

import styles from './TwitterOverlay.module.css'
import TwitterAuthButton from 'components/general/TwitterAuthButton'

import { ReactComponent as IconValidationCheck } from 'assets/img/iconValidationCheck.svg'

const messages = {
  twitterButton: 'Complete With Twitter',
  twitterAutofill: 'Completing with Twitter will auto-fill your:',
  twitterChecks: [
    'Display Name',
    'Handle',
    'Profile Picture',
    'Cover Photo',
    'Verified Badge (If Applicable)'
  ],
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
              <TwitterAuthButton
                showIcon={false}
                className={styles.twitterButton}
                textLabel={messages.twitterButton}
                onClick={props.onClick}
                onSuccess={props.onTwitterLogin}
                onFailure={(...args) => console.log(args)}
              />
              <div className={styles.autofillContainer}>
                <div className={styles.autofill}>
                  {messages.twitterAutofill}
                </div>
                <div className={styles.autofillChecklist}>
                  {messages.twitterChecks.map((check, ind) => (
                    <div key={ind} className={styles.checkItem}>
                      <div className={styles.checkIcon}>
                        {' '}
                        <IconValidationCheck />
                      </div>
                      {check}
                    </div>
                  ))}
                </div>
              </div>
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
  showTwitterOverlay: PropTypes.bool,
  initial: PropTypes.bool,
  onClick: PropTypes.func,
  onTwitterLogin: PropTypes.func,
  isMobile: PropTypes.bool
}

TwitterOverlay.defaultProps = {
  initial: false,
  isMobile: false
}

export default TwitterOverlay
