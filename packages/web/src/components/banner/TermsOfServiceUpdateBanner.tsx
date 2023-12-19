import { useCallback, useState } from 'react'

import { Name } from '@audius/common'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { TERMS_OF_SERVICE } from 'utils/route'

import { CallToActionBanner } from './CallToActionBanner'

const messages = {
  text: 'We’ve updated our Terms of Use and Privacy Policy. By continuing to use the Audius Service, you agree to our updated Terms of Use and Privacy'
}

const TOS_BANNER_LOCAL_STORAGE_KEY = 'dismissTOSBanner12.15.23'

/**
 * Displays a CTA Banner announcing ToS Updates
 */
export const TermsOfServiceUpdateBanner = () => {
  const dispatch = useDispatch()
  const hasDismissed = window.localStorage.getItem(TOS_BANNER_LOCAL_STORAGE_KEY)
  const [isVisible, setIsVisible] = useState(!hasDismissed)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    window.localStorage.setItem(TOS_BANNER_LOCAL_STORAGE_KEY, 'true')
  }, [])

  const handleAccept = useCallback(() => {
    window.open(TERMS_OF_SERVICE)
    dispatch(make(Name.BANNER_TOS_CLICKED, {}))
    handleClose()
  }, [dispatch, handleClose])

  return isVisible ? (
    <CallToActionBanner
      text={messages.text}
      emoji='gear'
      size='small'
      onClose={handleClose}
      onAccept={handleAccept}
    />
  ) : null
}
