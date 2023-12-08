import { useCallback, useEffect, useState } from 'react'

import { getWeb3Error } from 'common/store/backend/selectors'
import { isMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'

import { CallToActionBanner } from './CallToActionBanner'
import styles from './Web3ErrorBanner.module.css'

const messages = {
  text: 'Read The Configuration Guide',
  pill: 'Metamask Configured Incorrectly',
  mobileText: 'Metamask Configured Incorrectly. Read the Guide',
  mobilePill: 'Error'
}

const META_MASK_SETUP_URL =
  'https://help.audius.co/help/Configuring-MetaMask-For-Use-With-Audius-2d446'

/**
 * Displays an error banner if the user is trying to use Metamask but it's configured incorrectly
 */
export const Web3ErrorBanner = () => {
  const web3Error = useSelector(getWeb3Error)
  const [isVisible, setIsVisible] = useState(web3Error)

  const handleAccept = useCallback(() => {
    const win = window.open(META_MASK_SETUP_URL, '_blank')
    win?.focus()
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
  }, [setIsVisible])

  useEffect(() => {
    if (web3Error) {
      setIsVisible(true)
    }
  }, [web3Error])

  return isVisible ? (
    <CallToActionBanner
      className={styles.root}
      text={isMobile() ? messages.mobileText : messages.text}
      pill={isMobile() ? messages.mobilePill : messages.pill}
      onAccept={handleAccept}
      onClose={handleClose}
    />
  ) : null
}
