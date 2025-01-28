import { useCallback, useState } from 'react'

import { accountSelectors } from '@audius/common/src/store/account'
import { AIRDROP_PAGE, REWARDS_PAGE } from '@audius/common/src/utils/route'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { localStorage } from 'services/local-storage'
import { push as pushRoute, replace as replaceRoute } from 'utils/navigation'

import { CallToActionBanner } from './CallToActionBanner'

const AIRDROP_BANNER_LOCAL_STORAGE_KEY = 'dismissAirdropBanner'

const messages = {
  text: '2025 Airdrop is Live! Claim Now '
}
const { getIsAccountComplete } = accountSelectors

/**
 * Displays a CTA Banner encouraging the user to downlaod web and mobile apps
 * if the user is not logged in on desktop web (as logged in users see the Direct Messaging banner)
 */
export const AirdropAppBanner = () => {
  const dispatch = useDispatch()
  const hasDismissed = window.localStorage.getItem(
    AIRDROP_BANNER_LOCAL_STORAGE_KEY
  )

  const signedIn = useSelector(getIsAccountComplete)
  console.log('asdf hasDismissed, signedIn', signedIn, hasDismissed)

  const [isVisible, setIsVisible] = useState(!hasDismissed && signedIn)

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
      //   pill={messages.pill}
      emoji={'parachute'}
      onAccept={handleAccept}
      onClose={handleClose}
    />
  ) : null
}
