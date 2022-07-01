import { useCallback } from 'react'

import { IconArrow, IconDownload } from '@audius/stems'
import cn from 'classnames'
import { Parallax, withController } from 'react-scroll-parallax'

import HeroForeground from 'assets/img/publicSite/AudiusApp@2x.png'
import HeroBackgroundMobile from 'assets/img/publicSite/Hero-BG@1x.jpg'
import HeroBackground from 'assets/img/publicSite/Hero-BG@2x.jpg'
import HeroBackgroundXL from 'assets/img/publicSite/Hero-BG@3x.jpg'
import { ReactComponent as AppStoreBadge } from 'assets/img/publicSite/app-store-badge.svg'
import GlyphPattern1x from 'assets/img/publicSite/glyph-pattern@1x.png'
import GlyphPattern2x from 'assets/img/publicSite/glyph-pattern@2x.png'
import { ReactComponent as GooglePlayBadge } from 'assets/img/publicSite/google-play-badge.svg'
import { handleClickRoute } from 'components/public-site/handleClickRoute'
import { getIOSAppLink } from 'utils/appLinks'
import {
  APP_REDIRECT,
  AUDIUS_SIGN_UP_LINK,
  DOWNLOAD_START_LINK
} from 'utils/route'

import styles from './Hero.module.css'

const messages = {
  title: 'Discover New & Exclusive Music',
  subtitle: 'Upload, Share & Listen while earning $AUDIO Token Rewards',
  cta: 'Sign Up Free',
  download: 'Download The App'
}

type HeroProps = {
  isMobile: boolean
  onImageLoad: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
} & { parallaxController: any }

const iOSDownloadLink = getIOSAppLink()

export const Hero = (props: HeroProps) => {
  const { parallaxController, onImageLoad, isMobile } = props
  const onImgSet = useCallback(() => {
    if (!isMobile) parallaxController.update()
    onImageLoad()
  }, [parallaxController, onImageLoad, isMobile])

  if (props.isMobile) {
    return (
      <div className={cn(styles.heroContainer, styles.mobileContainer)}>
        <div className={styles.content}>
          <div className={styles.parallaxBg}> </div>
          <Parallax className={cn(styles.mobileBG)} y={[0, -30]}>
            <img
              src={HeroBackgroundMobile}
              sizes={'10vw'}
              className={styles.mobileImgBG}
              onLoad={onImgSet}
              alt='Background Purple Decoration'
            />
          </Parallax>
          <h1 className={styles.title}>{messages.title}</h1>
          <div className={styles.subtitle}>
            <div>{messages.subtitle}</div>
          </div>
          <button
            onClick={handleClickRoute(
              AUDIUS_SIGN_UP_LINK,
              props.setRenderPublicSite
            )}
            className={styles.ctaButton}
          >
            <span className={styles.ctaMessage}>{messages.cta}</span>
            <IconArrow className={styles.ctaArrow} />
          </button>
          <button
            onClick={handleClickRoute(APP_REDIRECT, props.setRenderPublicSite)}
            className={styles.downloadButton}
          >
            <IconDownload />
            <span className={styles.secondaryCtaMessage}>
              {messages.download}
            </span>
          </button>
          <div className={styles.appLinksContent}>
            <a href={iOSDownloadLink} target='_blank' rel='noopener noreferrer'>
              <AppStoreBadge
                aria-label='Download on the App Store'
                width={120}
                height={40}
              />
            </a>
            <a
              href='https://play.google.com/store/apps/details?id=co.audius.app'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GooglePlayBadge
                aria-label='Get it on Google Play'
                width={135}
                height={40}
                className={styles.googlePlayBtn}
              />
            </a>
          </div>
        </div>
        <img
          src={GlyphPattern1x}
          srcSet={`${GlyphPattern1x} 1x, ${GlyphPattern2x} 2x`}
          alt='Pattern'
          className={styles.glyphPattern}
        />
      </div>
    )
  }

  return (
    <div className={cn(styles.container, styles.heroContainer)}>
      <div className={styles.bg}>
        <div className={styles.parallaxBg}> </div>
        <Parallax
          className={cn(styles.background, styles.fgContainer)}
          y={[51, -10]}
          x={[64, 64]}
        >
          <img
            src={HeroForeground}
            className={styles.foregroundImg}
            onLoad={onImgSet}
            alt='Foreground Audius Mobile App'
          />
        </Parallax>
        <Parallax className={styles.background} y={[-10, -20]} x={[-25, -25]}>
          {/*
          // @ts-ignore */}
          <img
            srcSet={`${HeroBackground} 3840w, ${HeroBackgroundXL} 5500w`}
            sizes={'(max-width: 3815px) 3840w, 5500w'}
            src={HeroBackground}
            onLoad={onImgSet}
            className={styles.foreground}
            alt='Background Purple Decoration'
          />
        </Parallax>
        <Parallax className={styles.textContent} y={['-40px', '110px']}>
          <div className={styles.content}>
            <h1 className={styles.title}>{messages.title}</h1>
            <h2 className={styles.subtitle}>{messages.subtitle}</h2>
          </div>
        </Parallax>
        <Parallax
          className={styles.buttonContentParallax}
          y={['-40px', '110px']}
        >
          <div className={styles.buttonContent}>
            <button
              onClick={handleClickRoute(
                AUDIUS_SIGN_UP_LINK,
                props.setRenderPublicSite
              )}
              className={styles.ctaButton}
            >
              <span className={styles.ctaMessage}>{messages.cta}</span>
              <IconArrow width={30} height={30} className={styles.ctaArrow} />
            </button>
            <button
              onClick={handleClickRoute(
                DOWNLOAD_START_LINK,
                props.setRenderPublicSite
              )}
              className={styles.downloadButton}
            >
              <IconDownload />
              <span className={styles.secondaryCtaMessage}>
                {messages.download}
              </span>
            </button>
          </div>
        </Parallax>
        <Parallax
          className={styles.appLinksContentParallax}
          y={['-40px', '110px']}
        >
          <div className={styles.appLinksContent}>
            <a
              href='https://apps.apple.com/us/app/audius-music/id1491270519'
              target='_blank'
              rel='noopener noreferrer'
            >
              <AppStoreBadge
                aria-label='Download on the App Store'
                width={120}
                height={40}
              />
            </a>
            <a
              href='https://play.google.com/store/apps/details?id=co.audius.app'
              target='_blank'
              rel='noopener noreferrer'
            >
              <GooglePlayBadge
                aria-label='Get it on Google Play'
                width={135}
                height={40}
                className={styles.googlePlayBtn}
              />
            </a>
          </div>
        </Parallax>
      </div>

      <img
        src={GlyphPattern1x}
        srcSet={`${GlyphPattern1x} 1x, ${GlyphPattern2x} 2x`}
        alt='Pattern'
        className={styles.glyphPattern}
      />
    </div>
  )
}

export default withController(Hero)
