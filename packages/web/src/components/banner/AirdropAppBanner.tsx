import { useCallback, useEffect, useState } from 'react'

import { AIRDROP_PAGE } from '@audius/common/src/utils/route'
import { useDispatch } from 'react-redux'

import { localStorage } from 'services/local-storage'
import { push as pushRoute } from 'utils/navigation'

import { CallToActionBanner } from './CallToActionBanner'

const AIRDROP_BANNER_LOCAL_STORAGE_KEY = 'dismissAirdropBanner'

const messages = {
  text: '2025 Airdrop is Live! Claim Now '
}

export const AirdropAppBanner = () => {
  const dispatch = useDispatch()
  const hasDismissed = window.localStorage.getItem(
    AIRDROP_BANNER_LOCAL_STORAGE_KEY
  )
  const [isVisible, setIsVisible] = useState(!hasDismissed)

  useEffect(() => {
    if (!hasDismissed) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [hasDismissed])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    localStorage.setItem(AIRDROP_BANNER_LOCAL_STORAGE_KEY, 'true')
  }, [])

  const handleAccept = useCallback(() => {
    dispatch(pushRoute(AIRDROP_PAGE))
    handleClose()
  }, [dispatch, handleClose])

  return isVisible ? (
    <CallToActionBanner
      text={messages.text}
      emoji={'parachute'}
      onAccept={handleAccept}
      onClose={handleClose}
    />
  ) : null
}
