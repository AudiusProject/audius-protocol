import cn from 'classnames'
import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { CSSTransition } from 'react-transition-group'

import IconRemove from '../../assets/img/iconRemove.svg'
import { PlayerFlavor } from '../app'
import Artwork from '../artwork/Artwork'
import { CardDimensionsContext } from '../card/Card'

import AudiusLogo from './AudiusLogo'
import ListenOnAudiusCTA from './ListenOnAudiusCTA'
import styles from './PausePopover.module.css'
import { PauseContext } from './PauseProvider'
import pauseTransitions from './PauseTransitions.module.css'
import PrimaryLabel from './PrimaryLabel'

const DISMISS_BUTTON_CARD_LEFT_MARGIN = 12

const PausedPopoverCard = ({
  artworkURL,
  artworkClickURL,
  listenOnAudiusURL,
  flavor,
  isMobileWebTwitter
}) => {
  const { popoverVisibility, setPopoverVisibility } = useContext(PauseContext)
  const { width } = useContext(CardDimensionsContext)

  // Get the proper offset for the dismiss button in case we're in card mode
  const getDismissButtonStyle = () => {
    if (flavor === PlayerFlavor.COMPACT) return {}
    const bodyWidth = window.document.body.clientWidth
    const leftInset = (bodyWidth - width) / 2 + DISMISS_BUTTON_CARD_LEFT_MARGIN
    return {
      left: `${leftInset}px`
    }
  }

  return (
    <CSSTransition
      in={popoverVisibility}
      timeout={1000}
      classNames={pauseTransitions}
    >
      <div
        className={cn(styles.container, {
          [styles.blur]: popoverVisibility
        })}
        // Ensure that when the popover
        // is animating out, it's not clickable.
        style={popoverVisibility ? {} : { pointerEvents: 'none' }}
      >
        {flavor === PlayerFlavor.CARD && (
          <>
            <div className={styles.logo}>
              <AudiusLogo />
            </div>
            {!isMobileWebTwitter && (
              <Artwork
                artworkURL={artworkURL}
                onClickURL={artworkClickURL}
                className={styles.artworkSizing}
              />
            )}
          </>
        )}
        <PrimaryLabel
          className={
            flavor === PlayerFlavor.COMPACT
              ? styles.compactLabelFont
              : undefined
          }
        />
        <ListenOnAudiusCTA audiusURL={listenOnAudiusURL} />
        <div
          className={styles.dismissIcon}
          onClick={() => setPopoverVisibility(false)}
          style={getDismissButtonStyle()}
        >
          <IconRemove />
        </div>
      </div>
    </CSSTransition>
  )
}

export default PausedPopoverCard
