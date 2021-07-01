import React, { useState } from 'react'

import cn from 'classnames'
import { useSpring, animated } from 'react-spring'

import cypherImage2x from 'assets/img/publicSite/cypher@2x.jpg'
import podcastImage2x from 'assets/img/publicSite/podcast@2x.jpg'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import {
  AUDIUS_PODCAST_LINK,
  AUDIUS_CYPHER_LINK,
  pushWindowRoute
} from 'utils/route'

import styles from './JoinTheCommunity.module.css'

const messages = {
  title: 'Join The Community',
  subTitle:
    'The Audius community is full of up-and-coming DJs & producers looking to give back to the music scene'
}

const cards = [
  {
    title: 'Audius Podcast',
    description:
      'Artist interviews from the up-and-coming all the way to the established OGs. We talk about their craft and discuss the issues affecting all of us in the artist community.',
    image: podcastImage2x,
    backgroundGradient:
      'radial-gradient(circle at top left, rgba(27,71,204,0) 0%, rgba(27,158,204,0.75) 100%)',
    containerClass: styles.podcastContainer,
    cta: 'LISTEN NOW',
    onClick: () => pushWindowRoute(AUDIUS_PODCAST_LINK)
  },
  {
    title: 'Cypher Contests',
    description:
      'Join our bi-weekly production challenges! Use guest-curated sample packs, creative constraints, and compete for cash prizes decided by community vote.',
    image: cypherImage2x,
    backgroundGradient:
      'radial-gradient(circle at top left, rgba(227,0,239,0) 0%, rgba(234,0,187,0.5) 100%)',
    containerClass: styles.cypherContainer,
    cta: 'JOIN THE DISCORD',
    onClick: () => pushWindowRoute(AUDIUS_CYPHER_LINK)
  }
]

type CardProps = {
  title: string
  image: string
  backgroundGradient: string
  containerClass: string
  description: string
  cta: string
  onClick: () => void
}

const Card = (props: CardProps) => {
  const [cardRef, onMove, onLeave, transform] = useCardWeight({
    sensitivity: 1
  })
  const [mouseDown, setMouseDown] = useState(false)
  return (
    <div
      onClick={props.onClick}
      className={styles.cardMoveContainer}
      ref={cardRef}
      // @ts-ignore
      onMouseMove={onMove}
      onMouseLeave={() => {
        onLeave()
        setMouseDown(false)
      }}
      onMouseUp={() => setMouseDown(false)}
      onMouseDown={() => setMouseDown(true)}
    >
      <animated.div
        className={cn(styles.cardContainer, props.containerClass)}
        // @ts-ignore
        style={{
          transform: mouseDown ? '' : transform,
          backgroundBlendMode: 'multiply',
          background: `url(${props.image}) center/cover, ${props.backgroundGradient}`
        }}
      >
        <div className={cn(styles.cardContent)}>
          <div className={styles.cardTitle}>{props.title}</div>
          <div className={styles.cardDescription}>{props.description}</div>
          <button className={styles.cardButton}>{props.cta}</button>
        </div>
      </animated.div>
    </div>
  )
}

type JoinTheCommmunityProps = {
  isMobile: boolean
}

const JoinTheCommmunity = (props: JoinTheCommmunityProps) => {
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
        <div className={styles.title}>{messages.title}</div>
        <div className={styles.subTitle}>{messages.subTitle}</div>
        {cards.map((card, i) => (
          <div
            key={i}
            className={cn(styles.mobileCard, card.containerClass)}
            onClick={card.onClick}
            style={{
              backgroundBlendMode: 'multiply',
              background: `url(${card.image}) center/cover, ${card.backgroundGradient}`
            }}
          >
            <div className={cn(styles.mobileCardBG)}>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDescription}>{card.description}</div>
              <button className={styles.cardButton}>{card.cta}</button>
            </div>
          </div>
        ))}
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
              <div className={styles.title}>{messages.title}</div>
              <div className={styles.subTitle}>{messages.subTitle}</div>
            </div>
          </animated.div>
        </div>
        <div className={styles.cardsContainer}>
          {cards.map(card => (
            <Card key={card.title} {...card} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default JoinTheCommmunity
