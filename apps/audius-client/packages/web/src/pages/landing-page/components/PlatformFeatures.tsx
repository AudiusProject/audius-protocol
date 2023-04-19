import { ReactNode } from 'react'

import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import crowdImg from 'assets/img/publicSite/ImgCrowd.jpg'
import { ReactComponent as IconAudio } from 'assets/img/publicSite/iconAudio.svg'
import { ReactComponent as IconFree } from 'assets/img/publicSite/iconFree.svg'
import { ReactComponent as IconRemix } from 'assets/img/publicSite/iconRemix.svg'
import useHasViewed from 'hooks/useHasViewed'
import { useMatchesBreakpoint } from 'utils/useMatchesBreakpoint'

import styles from './PlatformFeatures.module.css'

const DESKTOP_NAV_BANNER_MIN_WIDTH = 1170
const MOBILE_WIDTH_MEDIA_QUERY = window.matchMedia(
  `(max-width: ${DESKTOP_NAV_BANNER_MIN_WIDTH}px)`
)

const messages = {
  title: 'Audius Listens to Artists',
  subTitle:
    'Audius listens to the needs of artists and fans - not just corporations & major labels'
}

type FeatureProps = {
  title: string
  description: string | ReactNode
  icon: ReactNode
  iconPosition: 'above' | 'side'
}

const features: Array<Omit<FeatureProps, 'iconPosition'>> = [
  {
    title: 'HQ AUDIO',
    description:
      'Audius offers crystal clear streaming at 320kbps! The highest quality sound from any free music platform.',
    icon: <IconAudio className={styles.featureIcon} />
  },
  {
    title: 'FREE FOREVER',
    description:
      'Unlimited uploads, metrics, dashboards, and more - All free forever, no strings attached.',
    icon: <IconFree className={styles.featureIcon} />
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
    icon: <IconRemix className={styles.featureIcon} />
  }
]

const Feature = (props: FeatureProps) => {
  return (
    <div className={styles.feature}>
      {props.iconPosition === 'side' ? props.icon : null}
      <div className={styles.featureText}>
        {props.iconPosition === 'above' ? props.icon : null}
        <div className={styles.featureTitle}>{props.title}</div>
        <div className={styles.featureDescription}>{props.description}</div>
      </div>
    </div>
  )
}

type PlatformFeaturesProps = {
  isMobile: boolean
}

const PlatformFeatures = (props: PlatformFeaturesProps) => {
  const isNarrow = useMatchesBreakpoint({
    mediaQuery: MOBILE_WIDTH_MEDIA_QUERY,
    initialValue: props.isMobile
  })

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
                (x) => `translate3d(0,${x}px,0)`
              )
            }}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{messages.title}</h3>
              <h4 className={styles.subTitle}>{messages.subTitle}</h4>
            </div>
          </animated.div>
        </div>
        <div className={styles.body}>
          <img
            src={crowdImg}
            className={styles.crowdImg}
            alt='DJ performing in front of crowd'
          />
          <div className={styles.features}>
            {features.map((feature) => (
              <Feature
                iconPosition={!props.isMobile && isNarrow ? 'above' : 'side'}
                key={feature.title}
                {...feature}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlatformFeatures
