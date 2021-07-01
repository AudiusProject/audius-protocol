import React, { useState, useCallback, useRef, useEffect } from 'react'

import cn from 'classnames'
import { Parallax } from 'react-scroll-parallax'
import { useChain, useTrail, animated } from 'react-spring'

import hqAudio from 'assets/img/publicSite/HQ-Audio@1x.jpg'
import { ReactComponent as IconArrow } from 'assets/img/publicSite/iconArrow.svg'
import { AUDIUS_LISTENING_LINK, pushWindowRoute } from 'utils/route'

import styles from './CTAListening.module.css'

const messages = {
  title1: 'Highest Audio Quality of Any Free',
  title2: 'Streaming Service',
  cta: 'Start Listening'
}

const title = `${messages.title1} ${messages.title2}`
const title1Items = messages.title1.split(' ')
const title2Items = messages.title2.split(' ')

const onStartListening = () => pushWindowRoute(AUDIUS_LISTENING_LINK)

type CTAListening = {
  isMobile: boolean
}

const CTAListening = (props: CTAListening) => {
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

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div className={styles.bgContainer}>
          <div className={styles.parallaxBg}></div>
          <Parallax
            className={cn(styles.mobileBgImage)}
            y={[-100, 0]}
            styleInner={{ height: '100%' }}
          >
            <img
              className={styles.mobileBackground}
              src={hqAudio}
              alt='Audius Audio Set'
            />
          </Parallax>
        </div>
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          <button onClick={onStartListening} className={styles.ctaButton}>
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
        <div className={styles.title}>
          <h3 className={styles.title1}>
            {trail.map(({ x, wordYPosition, ...rest }: any, index: any) => (
              <animated.span
                key={title1Items[index]}
                className={cn(styles.textAnimate)}
                style={{
                  ...rest,
                  transform: x.interpolate(
                    (x: number) => `translate3d(0,${x}px,0)`
                  )
                }}
              >
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
                  className={cn(cn(styles.textAnimate))}
                  style={{
                    ...rest,
                    transform: x.interpolate(
                      (x: number) => `translate3d(0,${x}px,0)`
                    )
                  }}
                >
                  <animated.div
                    className={cn(styles.word, styles.coloredTitleWord)}
                  >
                    {' '}
                    {title2Items[index]}{' '}
                  </animated.div>
                </animated.span>
              )
            )}
          </h3>
        </div>
        <button onClick={onStartListening} className={styles.ctaButton}>
          {messages.cta}
          <IconArrow className={styles.arrowRight} />
        </button>
      </div>
      <div className={styles.bgContainer}>
        <div className={styles.parallaxBg}></div>
        <Parallax
          className={cn(styles.bgParallax)}
          y={[-100, 20]}
          styleInner={{ height: '100%' }}
        >
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
