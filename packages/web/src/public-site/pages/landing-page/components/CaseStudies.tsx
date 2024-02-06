import { useState } from 'react'

import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import { useHistoryContext } from 'app/HistoryProvider'
import IconCaretRight from 'assets/img/iconCaretRight.svg'
import imgMerch from 'assets/img/publicSite/ImgMerch.jpg'
import imgRemix from 'assets/img/publicSite/ImgRemix.jpg'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import { handleClickRoute } from 'public-site/components/handleClickRoute'
import { AUDIUS_REMIX_CONTESTS_LINK } from 'utils/route'

import styles from './CaseStudies.module.css'

const messages = {
  title: 'Case Studies',
  subTitle: 'The Results Speak For Themselves',
  readMore: 'Read More'
}

const cards = [
  {
    title: 'Remix Competitions',
    description:
      'Lorem ipsum dolor sit amet consectetur. Elit nunc sit semper mattis aliquet erat ac ut. Ultrices sodales.',
    image: imgRemix,
    backgroundGradient:
      'radial-gradient(97.53% 194.75% at 3.62% 8.88%, #00F0FF 0%, #EB00FF 67.71%, #8F00FF 100%)',
    containerClass: styles.podcastContainer,
    cta: 'Explore Remixes',
    link: AUDIUS_REMIX_CONTESTS_LINK
  },
  {
    title: 'Success Stories',
    description:
      'Lorem ipsum dolor sit amet consectetur. Elit nunc sit semper mattis aliquet erat ac ut. Ultrices sodales.',
    image: imgMerch,
    backgroundGradient:
      'radial-gradient(97.53% 194.75% at 3.62% 8.88%, #8F00FF 0%, #00F0FF 100%)',
    containerClass: styles.cypherContainer,
    cta: 'Browse the Store',
    link: AUDIUS_REMIX_CONTESTS_LINK
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
          <button className={styles.cardButton}>
            <span>{messages.readMore}</span>
            <IconCaretRight className={styles.cardIcon} />
          </button>
        </div>
      </animated.div>
    </div>
  )
}

type CaseStudiesProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const CaseStudies = (props: CaseStudiesProps) => {
  const { history } = useHistoryContext()
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed(0.8)

  const textStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 150
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer} ref={refInView}>
        <div className={styles.content}>
          <animated.div
            style={{
              opacity: textStyles.opacity,
              transform: textStyles.x.interpolate(
                (x) => `translate3d(0,${x}px,0)`
              )
            }}
          >
            <div className={styles.title}>{messages.title}</div>
            <div className={styles.subTitle}>{messages.subTitle}</div>
          </animated.div>
        </div>
        {cards.map((card, i) => (
          <div
            key={i}
            className={cn(styles.mobileCard, card.containerClass)}
            onClick={handleClickRoute(
              card.link,
              props.setRenderPublicSite,
              history
            )}
            style={{
              backgroundBlendMode: 'multiply',
              background: `url(${card.image}) center/cover, ${card.backgroundGradient}`
            }}
          >
            <div className={cn(styles.mobileCardBG)}>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardDescription}>{card.description}</div>
              <button className={styles.cardButton}>
                <span>{messages.readMore}</span>
                <IconCaretRight className={styles.cardIcon} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.container} ref={refInView}>
      <div className={styles.content}>
        <animated.div
          style={{
            opacity: textStyles.opacity,
            transform: textStyles.x.interpolate(
              (x) => `translate3d(0,${x}px,0)`
            )
          }}
        >
          <div className={styles.title}>{messages.title}</div>
          <div className={styles.subTitle}>{messages.subTitle}</div>
        </animated.div>
        <div className={styles.cardsContainer}>
          {cards.map((card) => (
            <Card
              key={card.title}
              {...card}
              onClick={handleClickRoute(
                card.link,
                props.setRenderPublicSite,
                history
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CaseStudies
