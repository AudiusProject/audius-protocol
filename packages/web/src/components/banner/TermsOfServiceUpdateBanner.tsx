import { useCallback, useState } from 'react'

import { Name } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'

import { CallToActionBanner } from './CallToActionBanner'

const { PRIVACY_POLICY } = route

const messages = {
  text: 'We’ve updated our Privacy Policy. By continuing to use the Audius Service, you agree to our updated Privacy Policy'
}

const TOS_BANNER_LOCAL_STORAGE_KEY = 'dismissPrivacyPolicyBanner1.10.25'

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
