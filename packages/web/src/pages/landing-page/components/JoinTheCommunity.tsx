import { useState } from 'react'

import cn from 'classnames'
import { useSpring, animated } from 'react-spring'

import imgMerch from 'assets/img/publicSite/ImgMerch.jpg'
import imgRemix from 'assets/img/publicSite/ImgRemix.jpg'
import { handleClickRoute } from 'components/public-site/handleClickRoute'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import { AUDIUS_MERCH_LINK, AUDIUS_REMIX_CONTESTS_LINK } from 'utils/route'

import styles from './JoinTheCommunity.module.css'

const messages = {
  title: 'Join The Community',
  subTitle:
    'The Audius community is full of up-and-coming DJs & producers looking to give back to the music scene'
}

const cards = [
  {
    title: 'Remix Contests',
    description:
      'Take part in the hottest new remix competitions on Audius and dive in to explore the best our community has to offer.',
    image: imgRemix,
    backgroundGradient:
      'radial-gradient(97.53% 194.75% at 3.62% 8.88%, #00F0FF 0%, #EB00FF 67.71%, #8F00FF 100%)',
    containerClass: styles.podcastContainer,
    cta: 'Explore Remixes',
    link: AUDIUS_REMIX_CONTESTS_LINK
  },
  {
    title: 'Merch Store',
    description: 'Represent the revolution in music.',
    image: imgMerch,
    backgroundGradient:
      'radial-gradient(97.53% 194.75% at 3.62% 8.88%, #8F00FF 0%, #00F0FF 100%)',
    containerClass: styles.cypherContainer,
    cta: 'Browse the Store',
    link: AUDIUS_MERCH_LINK
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
        style={{
          // @ts-ignore
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
  setRenderPublicSite: (shouldRender: boolean) => void
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
            onClick={handleClickRoute(card.link, props.setRenderPublicSite)}
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
            <Card
              key={card.title}
              {...card}
              onClick={handleClickRoute(card.link, props.setRenderPublicSite)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default JoinTheCommmunity
