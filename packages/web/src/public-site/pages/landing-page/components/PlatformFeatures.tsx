import { ReactNode } from 'react'

import { IconAllTime, IconCart, IconUserGroup, IconGift } from '@audius/harmony'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import productShot from 'assets/img/publicSite/ProductShot3.webp'
import useHasViewed from 'hooks/useHasViewed'
import { useMatchesBreakpoint } from 'utils/useMatchesBreakpoint'

import styles from './PlatformFeatures.module.css'

const DESKTOP_NAV_BANNER_MIN_WIDTH = 1170
const MOBILE_WIDTH_MEDIA_QUERY = window.matchMedia(
  `(max-width: ${DESKTOP_NAV_BANNER_MIN_WIDTH}px)`
)

const messages = {
  title: ' Empowering Features for Artists',
  subTitle:
    'Take control of your music with the growing list of artist-centric features on Audius.'
}

type FeatureProps = {
  title: string
  description: string | ReactNode
  icon: ReactNode
  iconPosition: 'above' | 'side'
}

const features: Array<Omit<FeatureProps, 'iconPosition'>> = [
  {
    title: 'Free Unlimited Uploads & No Ads',
    description:
      'Free to use, with no limitations on uploads and a completely ad-free experience.',
    icon: (
      <div className={styles.featureIconContainer}>
        <IconAllTime size='xl' className={styles.allTimeIcon} />
      </div>
    )
  },
  {
    title: 'Grow Your Fanbase',
    description:
      'With Remix Contests, direct messaging, comments, and more. Audius gives you the tools to build a thriving fan community.',
    icon: (
      <div className={styles.featureIconContainer}>
        <IconCart size='xl' className={styles.cartIcon} />
      </div>
    )
  },
  {
    title: 'Sell Your Beats, Stems, & More',
    description:
      'Take advantage of features like premium download gates, and earn bonus rewards with every sale!',
    icon: (
      <div className={styles.featureIconContainer}>
        <IconUserGroup size='xl' className={styles.fanbaseIcon} />
      </div>
    )
  },
  {
    title: 'Earn Token Rewards',
    description:
      'Earn $AUDIO token rewards by completing achievements or winning weekly competitions!',
    icon: (
      <div className={styles.featureIconContainer}>
        <IconGift size='xl' className={styles.giftIcon} />
      </div>
    )
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
        {!props.isMobile ? (
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
        ) : null}
        <div className={styles.body}>
          <img
            src={productShot}
            className={styles.productShot}
            alt='Audius Web and Mobile Product Shot'
          />
          {props.isMobile ? (
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
          ) : null}
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
