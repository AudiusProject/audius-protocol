import { useState, useEffect, useCallback, useRef } from 'react'

import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useChain, useSpring, useTrail, animated } from 'react-spring'

import productShot from 'assets/img/publicSite/ProductShot2@2x.webp'
import dotsLogo1x from 'assets/img/publicSite/dot-logo@1x.jpg'
import dotsLogo2x from 'assets/img/publicSite/dot-logo@2x.jpg'

import styles from './Description.module.css'

const messages = {
  title1: 'A New Model',
  title2: 'Artist Owned & Controlled',
  description:
    "Step into the future with Audius, where we're rewriting the rules of the music industry. Designed by artists, for artists, Audius is not just a platform but a movement. Navigate your creative journey on your terms. In the music industry, connections make the difference, and Audius is where those connections happen. Join us in shaping the next chapter of music history."
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
    (node: HTMLHeadingElement) => {
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
                }}
              >
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
                  }}
                >
                  <animated.div
                    className={cn(
                      styles.word,
                      styles.coloredTitleWord,
                      wordGradients[index]
                    )}
                  >
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
            }}
          >
            <div className={cn(styles.description)}>
              <p>{messages.description}</p>
            </div>
          </animated.div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img
          src={dotsLogo1x}
          srcSet={`${dotsLogo1x} 1x, ${dotsLogo2x} 2x`}
          className={cn(styles.dotsLogo, styles.dotsLeft)}
          alt='Background moving dot pattern 1'
        />
        <div className={styles.foreground}>
          <img
            src={productShot}
            srcSet={`${productShot} 2x`}
            className={styles.productShot}
            alt='Audius Mobile Product Shot'
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
                }}
              >
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
                  }}
                >
                  <animated.div
                    className={cn(
                      styles.word,
                      styles.coloredTitleWord,
                      wordGradients[index]
                    )}
                  >
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
            }}
          >
            <div className={cn(styles.subText, styles.description)}>
              {messages.description}
            </div>
          </animated.div>
        </div>
        <img
          src={dotsLogo1x}
          srcSet={`${dotsLogo1x} 1x, ${dotsLogo2x} 2x`}
          className={cn(styles.dotsLogo, styles.dotsRight)}
          alt='Background moving dot pattern 2'
        />
      </div>
    </div>
  )
}

export default Description
