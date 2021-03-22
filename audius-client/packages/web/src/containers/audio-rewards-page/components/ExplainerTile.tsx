import React, { useCallback, useEffect, useRef, useState } from 'react'
import styles from './ExplainerTile.module.css'
import cn from 'classnames'
import { getTheme, isDarkMode as getIsDarkMode } from 'utils/theme/theme'
import TokenStill from 'assets/img/tokenSpinStill.png'
import Theme from 'models/Theme'

const TOKEN_ANIMATION_URL =
  'https://d1ne8ucs302cxl.cloudfront.net/animations/spinnytoken.mp4'
const TOKEN_ANIMATION_DARK_URL =
  'https://d1ne8ucs302cxl.cloudfront.net/animations/spinnytoken_dark.mp4'

const messages = {
  whatIsAudio: 'WHAT IS $AUDIO',
  audioDescription1: `Audius is owned by people like you, not major corporations.`,
  audioDescription2: `Holding $AUDIO grants you partial ownership of the Audius platform and gives you access to special features as they are released.`,
  confused: 'Still confused? Don’t worry, more details coming soon!',
  learnMore: 'Learn More'
}

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

type TileProps = {
  className?: string
}

export const Tile: React.FC<TileProps> = ({ className, children }) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}

/**
 * Explainer tile for badging system.
 * Has a spinny badge animation that should animate in a loop in a few times
 * on mount, and then again on mouse over.
 */
export const ExplainerTile = ({ className }: { className?: string }) => {
  const onClickLearnMore = () => window.open(LEARN_MORE_URL, '_blank')
  const [mouseOver, setMouseOver] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [initialPlaysRemaining, setInitialPlays] = useState(1)

  const handleOnEnded = useCallback(() => {
    setInitialPlays(p => p - 1)
    if ((initialPlaysRemaining > 0 || mouseOver) && videoRef.current) {
      videoRef.current.play()
    }
  }, [initialPlaysRemaining, mouseOver])

  useEffect(() => {
    if (mouseOver && videoRef.current) {
      videoRef.current.play()
    }
  }, [mouseOver])

  const isDarkMode = getIsDarkMode()
  const isMatrixMode = getTheme() === Theme.MATRIX

  return (
    <Tile className={cn([styles.explainerTile, className])}>
      <>
        <div className={styles.tokenHero}>
          {isMatrixMode ? (
            <img src={TokenStill} alt='' />
          ) : (
            <video
              autoPlay
              src={isDarkMode ? TOKEN_ANIMATION_DARK_URL : TOKEN_ANIMATION_URL}
              height={200}
              width={200}
              onMouseOver={() => setMouseOver(true)}
              onMouseOut={() => setMouseOver(false)}
              ref={videoRef}
              onEnded={handleOnEnded}
              muted
            />
          )}
        </div>
        <div className={styles.whatIsAudioContainer}>
          <h4 className={styles.whatIsAudio}>{messages.whatIsAudio}</h4>
          <p className={styles.description}>
            {messages.audioDescription1}
            <br />
            {messages.audioDescription2}
          </p>
          <div className={styles.learnMore} onClick={onClickLearnMore}>
            {messages.learnMore}
          </div>
          <div className={styles.description}>{messages.confused}</div>
        </div>
      </>
    </Tile>
  )
}

export default ExplainerTile
