import React from 'react'

import cn from 'classnames'
import { useTrail, animated } from 'react-spring'

import neonImg from 'assets/img/publicSite/neon.jpg'
import Footer from 'components/public-site/Footer'
import NavBanner from 'components/public-site/NavBanner'
import { AUDIUS_PRESS_KIT_ZIP } from 'utils/route'

import styles from './PressKitPage.module.css'

const messages = {
  title: 'Press Kit',
  download: 'Download Zip',
  description: 'Download the full Audius press kit and get:',
  content: 'photos, artwork, logos and more'
}

const wordStyles = [styles.pressGradient, styles.kitGradient]

type PressKitPageProps = {
  isMobile: boolean
  openNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const PressKitPage = (props: PressKitPageProps) => {
  const config = { mass: 5, tension: 2000, friction: 200 }

  const titleItems = messages.title.split(' ')

  const trail = useTrail(titleItems.length, {
    config,
    delay: 1000,
    to: { opacity: 1, x: 0 },
    from: { opacity: 0, x: 80 }
  })

  return (
    <div id='pressKitPage' className={styles.container}>
      <NavBanner
        invertColors
        className={styles.navBanner}
        isMobile={props.isMobile}
        openNavScreen={props.openNavScreen}
        setRenderPublicSite={props.setRenderPublicSite}
      />
      {props.isMobile ? (
        <div className={styles.mobileContainer}>
          <div className={styles.pressKitText}>
            {trail.map(({ x, wordYPosition, ...rest }: any, index: number) => (
              <animated.span
                key={titleItems[index]}
                className={cn(styles.word, wordStyles[index])}
                // @ts-ignore
                style={{
                  ...rest,
                  transform: x.interpolate(
                    (x: number) => `translate3d(0,${x}px,0)`
                  )
                }}
              >
                {titleItems[index]}
              </animated.span>
            ))}
          </div>
          <img src={neonImg} className={styles.image} alt='Audius Neon sign' />
          <a
            rel='noopener noreferrer'
            target='_blank'
            href={AUDIUS_PRESS_KIT_ZIP}
            download
          >
            <div className={styles.downloadButton}>{messages.download}</div>
          </a>
          <div className={styles.description}>
            <div>{messages.description}</div>
            <div>{messages.content}</div>
          </div>
        </div>
      ) : (
        <div className={styles.contentContainer}>
          <div className={styles.content}>
            <img
              src={neonImg}
              className={styles.image}
              alt='Audius Neon sign'
            />
            <div className={styles.textContainer}>
              <div className={styles.pressKitText}>
                {trail.map(({ x, wordYPosition, ...rest }: any, index: any) => (
                  <animated.span
                    key={titleItems[index]}
                    className={cn(styles.word, wordStyles[index])}
                    // @ts-ignore
                    style={{
                      ...rest,
                      transform: x.interpolate(
                        (x: number) => `translate3d(0,${x}px,0)`
                      )
                    }}
                  >
                    {titleItems[index]}
                  </animated.span>
                ))}
              </div>
              <a
                rel='noopener noreferrer'
                target='_blank'
                href={AUDIUS_PRESS_KIT_ZIP}
                download
              >
                <div className={styles.downloadButton}>{messages.download}</div>
              </a>
              <div className={styles.description}>
                <div>{messages.description}</div>
                <div>{messages.content}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer isMobile={props.isMobile} />
    </div>
  )
}

export default PressKitPage
