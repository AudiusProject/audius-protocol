import { useState, useEffect, useCallback, useRef } from 'react'

import cn from 'classnames'
import { useChain, useSpring, useTrail, animated } from 'react-spring'

import productShot from 'assets/img/publicSite/AudiusWeb@2x.png'
import dotsLogo1x from 'assets/img/publicSite/dot-logo@1x.jpg'
import dotsLogo2x from 'assets/img/publicSite/dot-logo@2x.jpg'

import styles from './Description.module.css'

const messages = {
  title1: 'Next Generation',
  title2: 'Web-3 Streaming Platform',
  description:
    'Audius is a brand-new streaming platform built for all musicians, not just those signed to labels.',
  features:
    'Build a fanbase, share your works in progress, and then publish your completed tracks for all the world to hear. Create, grow, and monetize, all without the need to graduate off the platform or sign a record deal.'
}

const title1Items = messages.title1.split(' ')
const title2Items = messages.title2.split(' ')
const config = { mass: 5, tension: 2000, friction: 200 }

type DescriptionProps = {
  isMobile: boolean
}

const Description = (props: DescriptionProps) => {
  const [hasViewed, setHasViewed] = useState(false)

  const startAnimation = useRef<HTMLDivElement | null>(null)
  const refInView = useCallback(() => {
    if (startAnimation.current) {
      const refBounding = startAnimation.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const elementTop = refBounding.top + scrollTop
      const windowScrollingBottom = window.innerHeight + scrollTop
      if (elementTop < windowScrollingBottom) {
        setHasViewed(true)
      }
    }
    return false
  }, [])

  const setStartAnimation = useCallback(
    (node) => {
      startAnimation.current = node
      refInView()
    },
    [refInView]
  )

  const firstTitleRef = useRef()
  const secTitleRef = useRef()
  const bodyRef = useRef()

  const trail = useTrail(title1Items.length, {
    // @ts-ignore
    ref: firstTitleRef,
    config,
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
  const bodyStyles = useSpring({
    // @ts-ignore
    ref: bodyRef,
    config: { mass: 3, tension: 2000, friction: 500 },
    to: { opacity: 1, x: 0 },
    from: { opacity: 0, x: 120 }
  })

  // @ts-ignore
  useChain(hasViewed ? [firstTitleRef, secTitleRef, bodyRef] : [], [0, 0.7, 1])

  useEffect(() => {
    refInView()
    window.addEventListener('scroll', refInView)
    return () => window.removeEventListener('scroll', refInView)
  }, [refInView])

  const wordGradients = [
    styles.gradient1,
    styles.gradient2,
    styles.gradient3,
    styles.gradient4,
    styles.gradient5
  ]

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <div className={styles.textSection}>
          <img
            src={productShot}
            srcSet={`${productShot} 2x`}
            className={styles.productShot}
            alt='Audius Product Shot'
          />
          <h3 ref={setStartAnimation} className={styles.title}>
            {trail.map(({ x, wordYPosition, ...rest }: any, index: any) => (
              <animated.span
                key={title1Items[index]}
                className={cn(styles.textAnimate)}
                // @ts-ignore
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
          <h3 className={styles.titleColor}>
            {secondTitle.map(
              ({ x, wordYPosition, ...rest }: any, index: number) => (
                <animated.span
                  key={title2Items[index]}
                  className={cn(cn(styles.textAnimate))}
                  // @ts-ignore
                  style={{
                    ...rest,
                    transform: x.interpolate(
                      (x: number) => `translate3d(0,${x}px,0)`
                    )
                  }}>
                  <animated.div
                    className={cn(
                      styles.word,
                      styles.coloredTitleWord,
                      wordGradients[index]
                    )}>
                    {' '}
                    {title2Items[index]}{' '}
                  </animated.div>
                </animated.span>
              )
            )}
          </h3>
          <animated.div
            className={styles.textDescription}
            style={{
              // @ts-ignore
              opacity: bodyStyles.opacity,
              // @ts-ignore
              transform: bodyStyles.x.interpolate(
                (x: number) => `translate3d(0,${x}px,0)`
              )
            }}>
            <div className={cn(styles.description)}>
              <p>{messages.description}</p>
              <p>{messages.features}</p>
            </div>
          </animated.div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.foreground}>
          <img
            src={productShot}
            srcSet={`${productShot} 2x`}
            className={styles.productShot}
            alt='Audius Product Shot'
          />
          <h3 ref={setStartAnimation} className={styles.title}>
            {trail.map(({ x, wordYPosition, ...rest }: any, index: any) => (
              <animated.span
                key={title1Items[index]}
                className={cn(styles.textAnimate)}
                // @ts-ignore
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
          <h3 className={styles.coloredTitle}>
            {secondTitle.map(
              ({ x, wordYPosition, ...rest }: any, index: number) => (
                <animated.span
                  key={title2Items[index]}
                  className={cn(cn(styles.textAnimate))}
                  // @ts-ignore
                  style={{
                    ...rest,
                    transform: x.interpolate(
                      (x: number) => `translate3d(0,${x}px,0)`
                    )
                  }}>
                  <animated.div
                    className={cn(
                      styles.word,
                      styles.coloredTitleWord,
                      wordGradients[index]
                    )}>
                    {' '}
                    {title2Items[index]}{' '}
                  </animated.div>
                </animated.span>
              )
            )}
          </h3>
          <animated.div
            className={styles.descriptionBody}
            style={{
              // @ts-ignore
              opacity: bodyStyles.opacity,
              // @ts-ignore
              transform: bodyStyles.x.interpolate(
                (x: number) => `translate3d(0,${x}px,0)`
              )
            }}>
            <div className={cn(styles.subText, styles.description)}>
              {messages.description}
            </div>
            <div className={cn(styles.subText, styles.description)}>
              {messages.features}
            </div>
          </animated.div>
        </div>
        <img
          src={dotsLogo1x}
          srcSet={`${dotsLogo1x} 1x, ${dotsLogo2x} 2x`}
          className={styles.dotsLogo}
          alt='Background moving dot pattern'
        />
      </div>
    </div>
  )
}

export default Description
