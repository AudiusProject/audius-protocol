import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import cn from 'classnames'
import { sample } from 'lodash'

import styles from './LoadingSplashScreen.module.css'
import { isMobile, getIsReadOnlyClient } from 'utils/clientUtil'
import { setTheme, getTheme, isDarkMode } from 'utils/theme/theme'

// Set the theme if there's one present
// We do this in the LoadingSplashScreen because
// it is the suspsense fallback before the app is loaded
const theme = getTheme()
if (theme) {
  setTheme(theme)
}

const spinnerGif = isDarkMode()
  ? require('assets/animations/SplashScreenDark@2x.gif')
  : require('assets/animations/SplashScreenLight@2x.gif')

const appRootId = 'root'
const messages = {
  loading: 'LOADING'
}

const FLAVOR_TEXT_OPTIONS = [
  "We're Warming Up...",
  'Warming Up the Amplifiers...',
  'Fading in the Master Track...',
  'Generating Beats...',
  'Equalizing Audio...',
  'Cranking Up the Volume...',
  'Building for the Drop...'
  // 'Putting the Click on the 24 Track',
  // 'Gathering Samples',
  // 'Quantizing the 808s',
  // 'Powering on the Monitors',
  // 'Tuning the Orchestra to 440Hz',
  // 'Finding the Opening Band',
  // 'Remixing Tracks'
]

export const LoadingSplashScreen = ({ isMobile, visible }) => {
  // Don't display the loading splash screen for read only clients
  if (getIsReadOnlyClient()) visible = false

  const flavorText = useRef(sample(FLAVOR_TEXT_OPTIONS))
  const [isShowing, setIsShowing] = useState(false)
  useEffect(() => {
    if (visible) setImmediate(() => setIsShowing(true))
    else {
      // Unmount from the dom after we fade out
      setTimeout(() => setIsShowing(false), 2000)
    }
  }, [visible])

  useEffect(() => {
    if (isMobile) {
      const appRoot = document.getElementById(appRootId)
      if (visible) {
        appRoot.classList.add(styles.scrollLock)
      } else {
        appRoot.classList.remove(styles.scrollLock)
      }
      return () => {
        appRoot.classList.remove(styles.scrollLock)
      }
    }
  }, [isMobile, visible])

  return visible || isShowing ? (
    <div
      className={cn(styles.splashScreenWrapper, {
        [styles.mobileWrapper]: isMobile,
        [styles.fadeIn]: isShowing,
        [styles.fadeOut]: !visible
      })}
    >
      <div
        className={cn(styles.contentWrapper, {
          [styles.delayFadeIn]: isShowing,
          [styles.fadeOut]: !visible
        })}
      >
        <div className={styles.animation}>
          <img className={styles.spinner} src={spinnerGif} alt='test' />
        </div>
        <div className={styles.loadingLabel}>{messages.loading}</div>
        <div className={styles.secondaryText}>{flavorText.current}</div>
      </div>
    </div>
  ) : null
}

const mapStateToProps = state => ({
  isMobile: isMobile()
})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(LoadingSplashScreen)
