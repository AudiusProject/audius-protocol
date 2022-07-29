import { BooleanKeys } from '@audius/common'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Transition } from 'react-spring/renderprops'

import { ReactComponent as IconGradientSave } from 'assets/img/gradientSave.svg'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import InstagramButton from 'components/instagram-button/InstagramButton'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import TwitterAuthButton from 'components/twitter-auth/TwitterAuthButton'
import { useRemoteVar } from 'hooks/useRemoteConfig'

import styles from './TwitterOverlay.module.css'

const messages = {
  instagramButton: 'Complete With Instagram',
  twitterButton: 'Complete With Twitter',
  linkProfile:
    'Quickly complete your profile by linking one of your social accounts.',
  twitterChecks: [
    'Display Name',
    'Handle',
    'Profile Picture',
    'Cover Photo',
    <div key={'verify'}>
      <div>
        {'Verification'} <IconVerified className={styles.verified} />
      </div>
      <div className={styles.ifApplicable}>{'(if applicable)'}</div>
    </div>
  ],
  manual: "I'd rather fill out my profile manually"
}

const TwitterOverlay = (props) => {
  const displayInstagram = useRemoteVar(
    BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP
  )

  const onClickTwitter = () => {
    props.onTwitterStart()
    props.onClick()
  }

  const onClickInstagram = () => {
    props.onInstagramStart()
    props.onClick()
  }

  return (
    <Transition
      items={props.showTwitterOverlay}
      from={{ opacity: props.initial ? 1 : 0 }}
      enter={{ opacity: 1 }}
      leave={{ opacity: 0 }}
      config={{ duration: 100 }}>
      {(show) =>
        show &&
        ((transitionProps) => (
          <div
            style={{
              ...transitionProps,
              zIndex: 10,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}>
            {props.isLoading || !props.showTwitterOverlay ? (
              <div className={styles.loadingContainer}>
                <LoadingSpinner className={styles.loadingSpinner} />
              </div>
            ) : (
              <div
                className={cn(styles.twitterOverlayContainer, {
                  [styles.isMobile]: props.isMobile
                })}>
                {displayInstagram && (
                  <InstagramButton
                    className={styles.instagramButton}
                    textClassName={styles.btnText}
                    iconClassName={styles.btnIcon}
                    onClick={onClickInstagram}
                    onSuccess={props.onInstagramLogin}
                    onFailure={props.onFailure}
                    text={messages.instagramButton}
                  />
                )}
                <TwitterAuthButton
                  showIcon={false}
                  className={styles.twitterButton}
                  textLabel={messages.twitterButton}
                  textClassName={styles.btnText}
                  iconClassName={styles.btnIcon}
                  onClick={onClickTwitter}
                  onSuccess={props.onTwitterLogin}
                  onFailure={props.onFailure}
                />
                <div className={styles.autofillContainer}>
                  <div className={styles.autofill}>{messages.linkProfile}</div>
                  <div className={styles.autofillChecklist}>
                    {messages.twitterChecks.map((check, ind) => (
                      <div key={ind} className={styles.checkItem}>
                        <div className={styles.checkIcon}>
                          {' '}
                          <IconGradientSave />
                        </div>
                        {check}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.divider}></div>
                <button
                  className={styles.manualText}
                  onClick={props.onToggleTwitterOverlay}>
                  {messages.manual}
                </button>
              </div>
            )}
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
  onTwitterStart: PropTypes.func,
  onInstagramStart: PropTypes.func,
  onTwitterLogin: PropTypes.func,
  onInstagramLogin: PropTypes.func,
  isMobile: PropTypes.bool
}

TwitterOverlay.defaultProps = {
  initial: false,
  isMobile: false
}

export default TwitterOverlay
