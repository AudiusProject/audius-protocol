import React from 'react'

import { Parallax } from 'react-scroll-parallax'

import footerBackgroundMobile from 'assets/img/publicSite/Footer-Background-mobile@2x.jpg'
import footerBackground from 'assets/img/publicSite/Footer-Background@2x.jpg'
import footerForeground from 'assets/img/publicSite/Footer-Foreground@2x.png'
import dots2x from 'assets/img/publicSite/dots@2x.jpg'
import { ReactComponent as IconArrow } from 'assets/img/publicSite/iconArrow.svg'
import { AUDIUS_SIGN_UP_LINK, pushWindowRoute } from 'utils/route'

import styles from './CTASignUp.module.css'

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
        style={{ backgroundImage: `url(${dots2x})` }}
      ></div>
    </div>
  )
}

export default CTASignUp
