import React, { memo } from 'react'

import Lottie from 'react-lottie'

import loadingSpinningGlyph from 'assets/animations/loadingSpinningGlyph.json'

import styles from './LoadingPage.module.css'

const messages = {
  title: 'Your Account is Almost Ready to Rock ',
  subtitle: 'We’re just finishing up a few things...'
}

const NotSignedIn = () => {
  const animationOptions = {
    loop: true,
    autoplay: true,
    animationData: loadingSpinningGlyph
  }

  return (
    <div className={styles.container}>
      <div className={styles.animationContainer}>
        <Lottie options={animationOptions} />
      </div>
      <div className={styles.title}>{messages.title}</div>
      <div className={styles.subtitle}>{messages.subtitle}</div>
    </div>
  )
}

export default memo(NotSignedIn)
