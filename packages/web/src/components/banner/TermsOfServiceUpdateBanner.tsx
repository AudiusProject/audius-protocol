import { useCallback, useState } from 'react'

import { Name } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'

import { CallToActionBanner } from './CallToActionBanner'

const { PRIVACY_POLICY } = route

const messages = {
  text: 'We’ve updated our Terms of Service. By continuing to use Audius, you agree to our updated Terms of Service'
}

const TOS_BANNER_LOCAL_STORAGE_KEY = 'dismissTermsOfServiceBanner6.24.25'

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
    window.open(PRIVACY_POLICY)
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
