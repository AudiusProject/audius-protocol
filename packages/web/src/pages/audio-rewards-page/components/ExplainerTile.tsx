import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Theme } from '@audius/common'
import cn from 'classnames'

import TokenStill from 'assets/img/tokenSpinStill.png'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useIsMobile } from 'utils/clientUtil'
import { getTheme, isDarkMode as getIsDarkMode } from 'utils/theme/theme'

import styles from './ExplainerTile.module.css'

const TOKEN_ANIMATION_URL =
  'https://d1ne8ucs302cxl.cloudfront.net/animations/spinnytoken.mp4'

const messages = {
  whatIsAudio: 'WHAT IS $AUDIO',
  audioDescription: `Audius is owned by people like you, not major corporations. Holding $AUDIO grants you partial ownership of the Audius platform and gives you access to special features as they are released.`,
  confused: 'Still confused? Don’t worry, more details coming soon!',
  learnMore: 'Learn More'
}

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

type TileProps = {
  className?: string
  children: ReactNode
}

export const Tile = ({ className, children }: TileProps) => {
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
  const isMobile = useIsMobile()

  const handleOnEnded = useCallback(() => {
    setInitialPlays((p) => p - 1)
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
  const showSvgToken = isDarkMode || isMatrixMode || isMobile

  const wm = useWithMobileStyle(styles.mobile)
  return (
    <Tile className={wm([styles.explainerTile, className])}>
      <>
        <div className={wm(styles.tokenHero)}>
          {showSvgToken ? (
            <img src={TokenStill} alt='' />
          ) : (
            <video
              autoPlay
              src={TOKEN_ANIMATION_URL}
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
        <div className={wm(styles.whatIsAudioContainer)}>
          <h4 className={wm(styles.whatIsAudio)}>{messages.whatIsAudio}</h4>
          <p className={styles.description}>{messages.audioDescription}</p>
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
