import React, { ReactNode } from 'react'

import cn from 'classnames'
import { useSpring, animated } from 'react-spring'

import { ReactComponent as IconAudio } from 'assets/img/publicSite/iconAudio.svg'
import { ReactComponent as IconCensorship } from 'assets/img/publicSite/iconCensorship.svg'
import { ReactComponent as IconFree } from 'assets/img/publicSite/iconFree.svg'
import womanPlayingGuitarImg1x from 'assets/img/publicSite/woman-playing-guitar@1x.jpg'
import womanPlayingGuitarImg2x from 'assets/img/publicSite/woman-playing-guitar@2x.jpg'
import useHasViewed from 'hooks/useHasViewed'

import styles from './PlatformFeatures.module.css'

const messages = {
  title: (isMobile: boolean) =>
    isMobile ? 'Designed for Artists' : 'Audius Listens to Artists',
  subTitle:
    'Music platforms were at their best when they listened to what artists and fans wanted - not corporations or major labels'
}

type FeatureProps = {
  title: string
  description: string | ReactNode
  icon: ReactNode
}

const features: Array<FeatureProps> = [
  {
    title: 'HQ AUDIO',
    description:
      'Audius offers crystal clear streaming at 320kbps! The highest quality sound from any free music platform.',
    icon: <IconFree className={styles.featureIcon} />
  },
  {
    title: 'FREE FOREVER',
    description:
      'Unlimited uploads, metrics, dashboards, and more - All free forever, no strings attached.',
    icon: <IconAudio className={styles.featureIcon} />
  },
  {
    title: 'EXCLUSIVE CONTENT',
    description: (
      <>
        {`Your fans can download stems and find remixes of your tracks right from
        the track page. `}
        <a
          href='https://twitter.com/AudiusProject/status/1272614652623519744?s=20'
          rel='noopener noreferrer'
          target='_blank'
        >
          Run your own contest
        </a>
        .
      </>
    ),
    icon: <IconCensorship className={styles.featureIcon} />
  }
]

const Feature = (props: FeatureProps) => {
  return (
    <div className={styles.feature}>
      {props.icon}
      <div className={styles.featureText}>
        <div className={styles.featureTitle}>{props.title}</div>
        <div className={styles.featureDescription}>{props.description}</div>
      </div>
    </div>
  )
}

type PlatformFeatures = {
  isMobile: boolean
}

const PlatformFeatures = (props: PlatformFeatures) => {
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed(0.8)

  const textStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 150
  })

  return (
    <div
      className={cn(styles.container, {
        [styles.isMobile]: props.isMobile
      })}
    >
      <div className={styles.content} ref={refInView}>
        <div className={styles.animateTitleContainer}>
          <animated.div
            style={{
              opacity: textStyles.opacity,
              transform: textStyles.x.interpolate(
                x => `translate3d(0,${x}px,0)`
              )
            }}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{messages.title(props.isMobile)}</h3>
              <h4 className={styles.subTitle}>{messages.subTitle}</h4>
            </div>
          </animated.div>
        </div>
        <div className={styles.body}>
          <img
            src={womanPlayingGuitarImg1x}
            srcSet={`${womanPlayingGuitarImg1x} 1x, ${womanPlayingGuitarImg2x} 2x`}
            className={styles.guitarImage}
            alt='Woman playing guitar'
          />
          <div className={styles.features}>
            {features.map(feature => (
              <Feature key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlatformFeatures
