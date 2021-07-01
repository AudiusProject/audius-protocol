import React, { useState } from 'react'

import { useSpring, animated } from 'react-spring'

import lau from 'assets/img/publicSite/3lau@2x.jpg'
import bnLLiveSets from 'assets/img/publicSite/BnLLiveSets@2x.jpg'
import { ReactComponent as IconLines } from 'assets/img/publicSite/Lines.svg'
import { ReactComponent as IconArrow } from 'assets/img/publicSite/iconArrow.svg'
import isItLove from 'assets/img/publicSite/isItLove@2x.jpg'
import { ReactComponent as IconListenOnAudius } from 'assets/img/publicSite/listen-on-audius.svg'
import staffordBrosPlaylist from 'assets/img/publicSite/staffordBrosPlaylist@2x.jpg'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import { pushWindowRoute } from 'utils/route'

import styles from './FeaturedContent.module.css'

const messages = {
  title: 'Featured Content',
  subTitle: 'Check out some of our favorite new releases on Audius'
}

type TrackProp = {
  title: string
  artist: string
  imageUrl: string
  color: string
  onClick: () => void
}

const tracks: Array<TrackProp> = [
  {
    title: '#SomethingBIG Podcast',
    artist: 'Stafford Brothers',
    imageUrl: staffordBrosPlaylist,
    color: 'rgba(0,0,0,0.4)',
    onClick: () =>
      pushWindowRoute(
        '/staffordbros/playlist/somethingbig-stafford-brothers-–-artist-spotlight-182'
      )
  },
  {
    title: 'Miss Me More',
    artist: '3LAU',
    imageUrl: lau,
    color: 'rgb(216, 121, 123, 0.4)',
    onClick: () => pushWindowRoute('/3lau/miss-me-more-1150')
  },
  {
    title: 'B&L Live Sets',
    artist: 'Brownies & Lemonade',
    imageUrl: bnLLiveSets,
    color: 'rgba(0,0,0,0.4)',
    onClick: () => pushWindowRoute('/teambandl/playlist/bl-live-sets-183')
  },
  {
    title: 'Is It Love',
    artist: '3LAU',
    imageUrl: isItLove,
    color: 'rgba(152, 218, 176, 0.4)',
    onClick: () => pushWindowRoute('/3lau/is-it-love-feat.-yeah-boy-1151')
  }
]

const Track = (props: TrackProp) => {
  const [cardRef, onMove, onLeave, transform] = useCardWeight({
    sensitivity: 1.8
  })
  const [mouseDown, setMouseDown] = useState(false)
  return (
    <div
      className={styles.trackMoveContainer}
      ref={cardRef}
      // @ts-ignore
      onClick={props.onClick}
      onMouseMove={onMove}
      onMouseLeave={() => {
        onLeave()
        setMouseDown(false)
      }}
      onMouseUp={() => setMouseDown(false)}
      onMouseDown={() => setMouseDown(true)}
    >
      <animated.div
        className={styles.trackContainer}
        // @ts-ignore
        style={{ transform: mouseDown ? '' : transform }}
      >
        <div
          className={styles.track}
          style={{
            backgroundImage: `url(${props.imageUrl})`,
            boxShadow: `0 10px 50px -2px ${props.color}`
          }}
        >
          <div className={styles.trackContent}>
            <div className={styles.trackTitle}>{props.title}</div>
            <div className={styles.trackArtist}>{`By ${props.artist}`}</div>
            <IconListenOnAudius className={styles.listenOnAudius} />
          </div>
        </div>
      </animated.div>
    </div>
  )
}

type FeaturedContentProps = {
  isMobile: boolean
}

const FeaturedContent = (props: FeaturedContentProps) => {
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed(0.8)

  const textStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 150
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <IconLines className={styles.lines} />
        <h3 className={styles.title}>{messages.title}</h3>
        <h4 className={styles.subTitle}>{messages.subTitle}</h4>
        <div className={styles.tracksContainer}>
          {tracks.map(track => (
            <div
              key={track.title}
              className={styles.trackContainer}
              onClick={track.onClick}
            >
              <div
                className={styles.trackImage}
                style={{
                  backgroundImage: `url(${track.imageUrl})`,
                  boxShadow: `0 10px 50px -2px ${track.color}`
                }}
              ></div>
              <div className={styles.trackTitle}>
                {track.title}
                <IconArrow className={styles.mobileIconArrow} />
              </div>
              <div className={styles.trackArtist}>{track.artist}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={refInView}>
      <div className={styles.content}>
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
              <h3 className={styles.title}>{messages.title}</h3>
              <h4 className={styles.subTitle}>{messages.subTitle}</h4>
            </div>
          </animated.div>
        </div>
        <div className={styles.tracksContainer}>
          {tracks.map(track => (
            <Track key={track.title} {...track} />
          ))}
        </div>
      </div>
      <IconLines className={styles.lines} />
    </div>
  )
}

export default FeaturedContent
