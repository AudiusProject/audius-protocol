import React from 'react'
import styles from './CTASignUp.module.css'
import { Parallax } from 'react-scroll-parallax'

import { ReactComponent as IconArrow } from 'assets/img/publicSite/iconArrow.svg'
import footerBackgroundMobile from 'assets/img/publicSite/Footer-Background-mobile.jpg'
import footerBackground from 'assets/img/publicSite/Footer-Background.jpg'
import footerForeground from 'assets/img/publicSite/Footer-Foreground.png'

import { AUDIUS_SIGN_UP_LINK, pushWindowRoute } from 'utils/links'

import dots from 'assets/img/publicSite/dots.jpg'

const messages = {
  title: 'Experience the Freedom',
  cta: 'Sign Up Free'
}

type CTASignUpProps = {
  isMobile: boolean
}

const onSignUp = () => {
  pushWindowRoute(AUDIUS_SIGN_UP_LINK)
}

const CTASignUp = (props: CTASignUpProps) => {
  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div
          className={styles.footerForeground}
          style={{ backgroundImage: `url(${footerForeground})` }}
        ></div>
        <div className={styles.mobileBgContent}>
          <div className={styles.parallaxBg}></div>
          <Parallax
            className={styles.bgParallax}
            y={[-100, 0]}
            styleInner={{
              position: 'absolute',
              height: '100%',
              width: '100%'
            }}
          >
            <div
              className={styles.footerBackground}
              style={{ backgroundImage: `url(${footerBackgroundMobile})` }}
            ></div>
          </Parallax>
        </div>
        <div className={styles.title}>{messages.title}</div>
        <div onClick={onSignUp} className={styles.ctaButton}>
          {messages.cta}
          <IconArrow className={styles.arrowRight} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>{messages.title}</div>
        <button onClick={onSignUp} className={styles.ctaButton}>
          {messages.cta}
          <IconArrow className={styles.arrowRight} />
        </button>
        <div
          className={styles.footerForeground}
          style={{ backgroundImage: `url(${footerForeground})` }}
        ></div>
      </div>
      <div className={styles.footerBackgroundContainer}>
        <div className={styles.bgContent}>
          <div className={styles.parallaxBg}></div>
          <Parallax
            className={styles.bgParallax}
            y={[-80, -40]}
            styleInner={{
              position: 'absolute',
              height: '100%',
              width: '100%'
            }}
          >
            <div
              className={styles.footerBackground}
              style={{ backgroundImage: `url(${footerBackground})` }}
            ></div>
          </Parallax>
        </div>
      </div>
      <div
        className={styles.dotsBackground}
        style={{ backgroundImage: `url(${dots})` }}
      ></div>
    </div>
  )
}

export default CTASignUp
