import cn from 'classnames'
import { Parallax } from 'react-scroll-parallax'
import { useSpring, animated } from 'react-spring'

import { ReactComponent as IconQuotePyramid } from 'assets/img/publicSite/quote-pyramid.svg'
import useHasViewed from 'hooks/useHasViewed'

import styles from './PlatformTagline.module.css'

const messages = {
  tagline: 'Finally, a modern streaming service designed with artists in mind.'
}

type PlatformTaglineProps = {
  isMobile: boolean
}

const PlatformTagline = (props: PlatformTaglineProps) => {
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
      })}>
      <div ref={refInView} className={styles.content}>
        <IconQuotePyramid className={styles.quotePyramid} />
        <div className={styles.animateTitleContainer}>
          <animated.div
            style={{
              opacity: textStyles.opacity,
              transform: textStyles.x.interpolate(
                (x) => `translate3d(0,${x}px,0)`
              ),
              width: '100%'
            }}>
            <div className={styles.tagline}>{messages.tagline}</div>
          </animated.div>
        </div>
      </div>
      {!props.isMobile && (
        <Parallax
          y={[-25, 10]}
          styleInner={{
            position: 'absolute',
            bottom: '-280px',
            left: '-152px',
            height: '100%'
          }}></Parallax>
      )}
    </div>
  )
}

export default PlatformTagline
