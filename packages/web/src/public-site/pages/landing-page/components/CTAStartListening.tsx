import { Parallax } from 'react-scroll-parallax'

import IconCaretRight from 'assets/img/iconCaretRight.svg'
import footerBackgroundMobile from 'assets/img/publicSite/Footer-Background-mobile@2x.jpg'
import footerBackground from 'assets/img/publicSite/Footer-Background@2x.jpg'
import footerForeground from 'assets/img/publicSite/Footer-Foreground@2x.png'
import dots2x from 'assets/img/publicSite/dots@2x.jpg'
import { handleClickRoute } from 'public-site/components/handleClickRoute'
import { TRENDING_PAGE } from 'utils/route'

import styles from './CTAStartListening.module.css'

const messages = {
  title: 'Artists Deserve More',
  cta: 'Start Listening'
}

type CTAStartListeningProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const CTAStartListening = (props: CTAStartListeningProps) => {
  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div
          className={styles.footerForeground}
          style={{ backgroundImage: `url(${footerForeground})` }}
        />
        <div className={styles.mobileBgContent}>
          <div className={styles.parallaxBg}></div>
          <Parallax className={styles.bgParallax} translateY={[-100, 0]}>
            <div
              className={styles.footerBackground}
              style={{
                backgroundImage: `url(${footerBackgroundMobile})`
              }}
            />
          </Parallax>
        </div>
        <div className={styles.title}>{messages.title}</div>
        <div
          onClick={handleClickRoute(TRENDING_PAGE, props.setRenderPublicSite)}
          className={styles.ctaButton}
        >
          {messages.cta}
          <IconCaretRight className={styles.iconCaretRight} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>{messages.title}</div>
        <button
          onClick={handleClickRoute(TRENDING_PAGE, props.setRenderPublicSite)}
          className={styles.ctaButton}
        >
          {messages.cta}
          <IconCaretRight className={styles.iconCaretRight} />
        </button>
        <div
          className={styles.footerForeground}
          style={{ backgroundImage: `url(${footerForeground})` }}
        />
      </div>
      <div className={styles.footerBackgroundContainer}>
        <div className={styles.bgContent}>
          <div className={styles.parallaxBg}></div>
          <Parallax className={styles.bgParallax} translateY={[-70, -30]}>
            <div
              className={styles.footerBackground}
              style={{
                backgroundImage: `url(${footerBackground})`
              }}
            />
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

export default CTAStartListening
