import { useState, useCallback, useRef, useEffect } from 'react'

import { IconArrow } from '@audius/stems'
import cn from 'classnames'
import { Parallax } from 'react-scroll-parallax'
import { useChain, useTrail, animated } from 'react-spring'

import appImg from 'assets/img/publicSite/AudiusAppAlt@2x.png'
import hqAudio from 'assets/img/publicSite/HQ-Audio@1x.jpg'
import { useMatchesBreakpoint } from 'common/hooks/useMatchesBreakpoint'
import { handleClickRoute } from 'components/public-site/handleClickRoute'
import { AUDIUS_LISTENING_LINK } from 'utils/route'

import styles from './CTAListening.module.css'

const MOBILE_WIDTH_MEDIA_QUERY = window.matchMedia('(max-width: 1150px)')

const messages = {
  title1: '320kbps Streaming For Free',
  title2: 'The way your music should be heard.',
  cta: 'Start Uploading Today'
}

const title1Items = messages.title1.split(' ')
const title2Items = messages.title2.split(' ')

type CTAListeningProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const CTAListening = (props: CTAListeningProps) => {
  const isNarrow = useMatchesBreakpoint({
    initialValue: props.isMobile,
    mediaQuery: MOBILE_WIDTH_MEDIA_QUERY
  })
  const [hasViewed, setHasViewed] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)

  const refInView = useCallback(() => {
    if (containerRef.current) {
      const refBounding = (containerRef.current as any).getBoundingClientRect()
      if (refBounding.top < window.innerHeight * 0.9) {
        setHasViewed(true)
      }
    }
    return false
  }, [setHasViewed])

  const firstTitleRef = useRef()
  const secTitleRef = useRef()

  const trail = useTrail(title1Items.length, {
    // @ts-ignore
    ref: firstTitleRef,
    config: { mass: 5, tension: 2000, friction: 200 },
    to: { opacity: 1, x: 0 },
    from: { opacity: 0, x: 80 }
  })

  const secondTitle = useTrail(title2Items.length, {
    // @ts-ignore
    ref: secTitleRef,
    config: { mass: 3, tension: 2000, friction: 200 },
    to: { opacity: 1, x: 0 },
    from: { opacity: 0, x: 80 }
  })

  // @ts-ignore
  useChain(hasViewed ? [firstTitleRef, secTitleRef] : [], [0, 0.8])

  useEffect(() => {
    refInView()
    window.addEventListener('scroll', refInView)
    return () => window.removeEventListener('scroll', refInView)
  }, [refInView])

  if (props.isMobile || isNarrow) {
    return (
      <div className={styles.mobileContainer}>
        <div className={styles.bgContainer}>
          <div className={styles.parallaxBg}></div>
          <Parallax
            className={cn(styles.mobileBgImage)}
            y={[-100, 0]}
            styleInner={{ height: '100%' }}>
            <img
              className={styles.mobileBackground}
              src={hqAudio}
              alt='Audius Audio Set'
            />
          </Parallax>
        </div>
        <div className={styles.textContent}>
          <div className={styles.appImgContainer}>
            <img
              src={appImg}
              className={styles.appImg}
              alt='Audius mobile app'
            />
          </div>
          <div className={styles.titlesContainer}>
            <div className={styles.title}>
              <div className={styles.title1}>{messages.title1}</div>
              <div className={styles.title2}>{messages.title2}</div>
            </div>
          </div>
          <button
            onClick={handleClickRoute(
              AUDIUS_LISTENING_LINK,
              props.setRenderPublicSite
            )}
            className={styles.ctaButton}>
            {messages.cta}
            <IconArrow className={styles.arrowRight} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.content}>
        <div className={styles.appImgContainer}>
          <img src={appImg} className={styles.appImg} alt='Audius mobile app' />
        </div>
        <div className={styles.textContent}>
          <div className={styles.title}>
            <h3 className={styles.title1}>
              {trail.map(({ x, wordYPosition, ...rest }: any, index: any) => (
                <animated.span
                  key={title1Items[index]}
                  className={cn(styles.textAnimateTitle1)}
                  style={{
                    ...rest,
                    transform: x.interpolate(
                      (x: number) => `translate3d(0,${x}px,0)`
                    )
                  }}>
                  <animated.div className={styles.word}>
                    {' '}
                    {title1Items[index]}{' '}
                  </animated.div>
                </animated.span>
              ))}
            </h3>
            <h3 className={styles.title2}>
              {secondTitle.map(
                ({ x, wordYPosition, ...rest }: any, index: number) => (
                  <animated.span
                    key={title2Items[index]}
                    className={cn(cn(styles.textAnimateTitle2))}
                    style={{
                      ...rest,
                      transform: x.interpolate(
                        (x: number) => `translate3d(0,${x}px,0)`
                      )
                    }}>
                    <animated.div
                      className={cn(styles.word, styles.coloredTitleWord)}>
                      {' '}
                      {title2Items[index]}{' '}
                    </animated.div>
                  </animated.span>
                )
              )}
            </h3>
          </div>
          <button
            onClick={handleClickRoute(
              AUDIUS_LISTENING_LINK,
              props.setRenderPublicSite
            )}
            className={styles.ctaButton}>
            {messages.cta}
            <IconArrow className={styles.arrowRight} />
          </button>
        </div>
      </div>
      <div className={styles.bgContainer}>
        <div className={styles.parallaxBg}></div>
        <Parallax
          className={cn(styles.bgParallax)}
          y={[-100, 20]}
          styleInner={{ height: '100%' }}>
          <img
            className={styles.background}
            src={hqAudio}
            alt='Audius Audio Set'
          />
        </Parallax>
      </div>
    </div>
  )
}

export default CTAListening
