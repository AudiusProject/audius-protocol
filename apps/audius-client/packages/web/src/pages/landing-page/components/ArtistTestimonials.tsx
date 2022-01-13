import React, { useState, useRef, useEffect, useCallback } from 'react'

import { Parallax } from 'react-scroll-parallax'
import { useSpring, useTransition, animated } from 'react-spring'

import artistBlau from 'assets/img/publicSite/artist-blau@2x.jpg'
import artistDeadmau5 from 'assets/img/publicSite/artist-deadmau5@2x.jpg'
import artistMrCarmack from 'assets/img/publicSite/artist-mrcarmack@2x.jpg'
import artistRezz from 'assets/img/publicSite/artist-rezz@2x.jpg'
import artistStaffordsBros from 'assets/img/publicSite/artist-staffordbros@2x.jpg'
import dots2x from 'assets/img/publicSite/dots@2x.jpg'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'

import styles from './ArtistTestimonials.module.css'

const messages = {
  title: 'Built With The Best',
  subtitle: 'We designed it with you in mind and with them by our side.'
}

type AristProps = {
  imageUrl: string
  name: string
  credit: string
  color: string
  setSelectedIndex: () => void
  containerRef: any
}

const Artist = (props: AristProps) => {
  const [cardRef, onMove, onLeave, transform] = useCardWeight({
    sensitivity: 5
  })

  return (
    <div
      className={styles.cardMoveContainer}
      ref={props.containerRef}
      // @ts-ignore
      onMouseMove={onMove}
      onMouseEnter={props.setSelectedIndex}
      onMouseLeave={onLeave}
    >
      <div ref={cardRef} className={styles.artistContainer}>
        <animated.img
          src={props.imageUrl}
          className={styles.artistImage}
          style={{
            transform,
            boxShadow: `0 10px 50px -2px ${props.color}`
          }}
        />
      </div>
      <div className={styles.artistName}>{props.name}</div>
    </div>
  )
}

type MobileArtistProps = {
  imageUrl: string
  name: string
  color: string
}
const MobileArtist = (props: MobileArtistProps) => {
  return (
    <div className={styles.artistCard}>
      <img
        src={props.imageUrl}
        className={styles.artistImage}
        alt='Audius Artist'
        style={{
          boxShadow: `0 10px 50px -2px ${props.color}`
        }}
      />
      <div className={styles.artistName}>{props.name}</div>
    </div>
  )
}

const artists = [
  {
    name: 'deadmau5',
    imageUrl: artistDeadmau5,
    color: 'rgba(16,24,28,0.4)',
    quote:
      'As an artist, I spend much of my time seeing around the corner to the future of the industry, and Audius is clearly the way forward. I’m thrilled to join this team.',
    credit: 'Joel Zimmerman (deadmau5)'
  },
  {
    name: 'Rezz',
    imageUrl: artistRezz,
    color: 'rgba(115,5,123,0.4)',
    quote: '',
    credit: 'Rezz'
  },
  {
    name: '3LAU',
    imageUrl: artistBlau,
    color: 'rgba(19,93,119,0.4)',
    quote: '',
    credit: '3LAU'
  },
  {
    name: 'MR•CAR/\\\\ACK',
    imageUrl: artistMrCarmack,
    color: 'rgba(99,2,2,0.4)',
    quote: '',
    credit: 'MR•CAR/\\\\ACK'
  },
  {
    name: 'The Stafford Brothers',
    imageUrl: artistStaffordsBros,
    color: 'rgba(46,46,46,0.4)',
    quote: '',
    credit: 'The Stafford Brothers'
  }
]

// NOTE: Internet explorer & Microsoft edge do not support css 'clip-path'
const browserDoesNotSupportClipPath = () => {
  return (
    /MSIE 10/i.test(navigator.userAgent) ||
    /MSIE 9/i.test(navigator.userAgent) ||
    /rv:11.0/i.test(navigator.userAgent) ||
    /Edge\/\d./i.test(navigator.userAgent)
  )
}

const supportsClipPath = !browserDoesNotSupportClipPath()

const quoteComponents = artists.map(({ credit, quote }, i) => (
  <div className={styles.artistQuoteContainer} key={i}>
    <div>{quote}</div>
    <div className={styles.byArtistName}>{`- ${credit}`}</div>
  </div>
))

type ArtistTestimonialsProps = {
  isMobile: boolean
}

// Update the selected artist every TRANSITION_ARTIST_INTERVAL msec
// const TRANSITION_ARTIST_INTERVAL = 5 * 1000

const ArtistTestimonials = (props: ArtistTestimonialsProps) => {
  // const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedIndex = 0
  const [lastActive, setLastActive] = useState(0)
  const offset = useRef(0)
  const artistCards = useRef<Array<HTMLElement | null>>(
    Array.from({ length: artists.length }, () => null)
  )

  const [{ carrotXPosition }, setCarrotPosition] = useSpring<{
    carrotXPosition: number
  }>(() => ({ carrotXPosition: 0 }))
  const [{ containerXPos }, setContainerXPos] = useSpring<{
    containerXPos: number
  }>(() => ({ containerXPos: 0 }))

  // useEffect(() => {
  //   const transitionInterval = setInterval(() => {
  //     setSelectedIndex(index => (index + 1) % artists.length)
  //   }, TRANSITION_ARTIST_INTERVAL)
  //   return () => clearInterval(transitionInterval)
  // }, [selectedIndex])

  const setAristsRef = (index: number) => (node: HTMLDivElement) => {
    if (node !== null) {
      artistCards.current[index] = node
      if (index === 0) {
        const { width } = (node as HTMLElement).getBoundingClientRect()
        const offsetX = (node as HTMLElement).offsetLeft
        offset.current = offsetX + width / 2
      }
    }
  }

  const [quoteContainerWidth, setQuoteContainerWidth] = useState(0)
  const [quoteBlockWidth, setQuoteBlockWidth] = useState(0)

  const setQuoteContainer = useCallback(node => {
    if (node !== null) {
      const quoteContainerWidth = node.getBoundingClientRect().width
      setQuoteContainerWidth(quoteContainerWidth)
    }
  }, [])

  const setQuoteBlock = useCallback(node => {
    if (node !== null) {
      const quoteBlocNodekWidth = node.getBoundingClientRect().width
      setQuoteBlockWidth(quoteBlocNodekWidth)
    }
  }, [])

  // When updating the artist, update the position of the bottom div and carrot
  useEffect(() => {
    // Set the offset position where the carrot will be
    const element = artistCards.current[selectedIndex]
    if (!element) return
    const { width } = (element as HTMLElement).getBoundingClientRect()
    const offsetX = (element as HTMLElement).offsetLeft
    offset.current = offsetX + width / 2

    if (selectedIndex === 0) {
      const carrotPosition = offset.current
      setCarrotPosition({ carrotXPosition: carrotPosition })
      setContainerXPos({ containerXPos: 0 })
    } else if (selectedIndex === 1) {
      const carrotPosition = offset.current
      setCarrotPosition({ carrotXPosition: carrotPosition })
      setContainerXPos({ containerXPos: 0 })
    } else if (selectedIndex === 2) {
      const middle = quoteContainerWidth / 2 - quoteBlockWidth / 2
      const carrotPosition = offset.current - middle
      setCarrotPosition({ carrotXPosition: carrotPosition })
      setContainerXPos({ containerXPos: middle })
    } else if (selectedIndex === 3) {
      const endPosition = quoteContainerWidth - quoteBlockWidth
      const carrotPosition = offset.current - endPosition
      setCarrotPosition({ carrotXPosition: carrotPosition })
      setContainerXPos({ containerXPos: endPosition })
    } else if (selectedIndex === 4) {
      const endPosition = quoteContainerWidth - quoteBlockWidth
      const carrotPosition = offset.current - endPosition
      setCarrotPosition({ carrotXPosition: carrotPosition })
      setContainerXPos({ containerXPos: endPosition })
    }
    setLastActive(selectedIndex)
  }, [
    quoteContainerWidth,
    quoteBlockWidth,
    selectedIndex,
    offset,
    setCarrotPosition,
    setContainerXPos
  ])

  const trans1 = (x: number) => `translate(${x}px)`
  const clipCarrotPosition = (x: number) =>
    `polygon(${x}px 0, ${x - 12}px 100%, ${x + 12}px 100%)`

  const transitions = useTransition(selectedIndex, null, {
    leave: (_: any) => ({
      opacity: 0,
      transform: `translate(${
        selectedIndex > lastActive ? '-' : ''
      }${quoteContainerWidth}px)`
    }),
    enter: (_: any) => {
      return {
        opacity: 1,
        transform: 'translate(0px)'
      }
    },
    from: (_: any) => {
      return {
        opacity: 0,
        transform: `translate(${
          selectedIndex > lastActive ? '' : '-'
        }${quoteContainerWidth}px)`
      }
    }
  })

  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed()
  // @ts-ignore
  const titleStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 120
  })

  if (props.isMobile) {
    // The mobile quote should be the deadmau5 quote
    const displayQuote = artists[0]

    return (
      <div className={styles.mobileContainer}>
        <div
          className={styles.dotsBackground}
          style={{ backgroundImage: `url(${dots2x})` }}
        ></div>
        <h3 className={styles.title}>{messages.title}</h3>
        <h3 className={styles.subTitle}>{messages.subtitle}</h3>
        <div className={styles.artistsContainer}>
          {artists.reverse().map(artist => (
            <MobileArtist key={artist.name} {...artist} />
          ))}
        </div>
        <div className={styles.quoteCarrot}></div>
        <div className={styles.quoteBlock}>
          <p>{displayQuote.quote}</p>
          <div
            className={styles.artistQuoteName}
          >{`- ${displayQuote.credit}`}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div ref={refInView} className={styles.content}>
        <div className={styles.foreground}>
          <div className={styles.animateTitleContainer}>
            <animated.div
              style={{
                opacity: titleStyles.opacity,
                // @ts-ignore
                transform: titleStyles.x.interpolate(
                  x => `translate3d(0,${x}px,0)`
                ),
                width: '100%'
              }}
            >
              <h3 className={styles.title}>{messages.title}</h3>
              <h3 className={styles.subTitle}>{messages.subtitle}</h3>
            </animated.div>
          </div>
          <div className={styles.artistsContainer}>
            {artists.map((artist, idx) => (
              <Artist
                key={artist.name}
                {...artist}
                containerRef={setAristsRef(idx)}
                setSelectedIndex={() => {
                  // setSelectedIndex(idx)
                }}
              />
            ))}
          </div>
          <div ref={setQuoteContainer} className={styles.quoteContainer}>
            <animated.div
              ref={setQuoteBlock}
              className={styles.quoteBlock}
              style={{
                transform: containerXPos.interpolate(trans1)
              }}
            >
              <div className={styles.quoteCarrotContainer}>
                {supportsClipPath && (
                  <animated.div
                    className={styles.quoteCarrot}
                    style={{
                      clipPath: carrotXPosition.interpolate(clipCarrotPosition)
                    }}
                  ></animated.div>
                )}
              </div>
              <div className={styles.quoteContent}>
                {transitions.map(({ item, props, key }) => (
                  <animated.div
                    key={key}
                    style={{ ...props }}
                    className={styles.quote}
                  >
                    {quoteComponents[item]}
                  </animated.div>
                ))}
              </div>
            </animated.div>
          </div>
        </div>
        <Parallax
          y={[-15, 30]}
          styleInner={{
            position: 'absolute',
            top: '-70px',
            height: '100%'
          }}
        >
          <div
            className={styles.dotsBackground}
            style={{ backgroundImage: `url(${dots2x})` }}
          ></div>
        </Parallax>
      </div>
    </div>
  )
}

export default ArtistTestimonials
