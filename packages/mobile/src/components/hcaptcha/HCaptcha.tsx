import { useCallback, useEffect, useRef, useState } from 'react'

import {
  HCaptchaStatus,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  modalsActions,
  modalsSelectors
} from '@audius/common'
import ConfirmHcaptcha from '@hcaptcha/react-native-hcaptcha'
import type { NativeSyntheticEvent } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { env } from 'app/env'

const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors
const { getHCaptchaStatus } = audioRewardsPageSelectors
const { updateHCaptchaScore } = audioRewardsPageActions

type HCaptchaMessage = {
  data: string
}

const siteKey = env.HCAPTCHA_SITE_KEY as string
const baseUrl = env.HCAPTCHA_BASE_URL

const HCAPTCHA_MODAL_NAME = 'HCaptcha'
const REWARD_MODAL_NAME = 'ChallengeRewardsExplainer'

// on clicking outside of the hcaptcha modal,
// the onMessage callback function gets triggered repeatedly,
// causing a stack overflow
// so we use this variable to prevent that from happening
let hasMessageFired = false

const HCaptchaModal = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector((state) =>
    getModalVisibility(state, HCAPTCHA_MODAL_NAME)
  )
  const hCaptchaStatus = useSelector(getHCaptchaStatus)
  const ref = useRef<ConfirmHcaptcha>(null)
  const [hasCode, setHasCode] = useState(false)

  useEffect(() => {
    if (isOpen && ref?.current) {
      ref.current.show()
    }
    if (!isOpen) {
      hasMessageFired = false
      setHasCode(false)
    }
  }, [isOpen, ref])

  const hideHCaptcha = useCallback(() => {
    if (ref?.current) {
      ref.current.hide()
    }
  }, [ref])

  const handleClose = useCallback(() => {
    hideHCaptcha()
    dispatch(setVisibility({ modal: HCAPTCHA_MODAL_NAME, visible: false }))
    dispatch(setVisibility({ modal: REWARD_MODAL_NAME, visible: true }))
  }, [dispatch, hideHCaptcha])

  useEffect(() => {
    if (hCaptchaStatus === HCaptchaStatus.NONE) {
      return
    }
    // audius-client handles the updating of the hcaptcha status in the store
    // we can close the native mobile drawer
    handleClose()
  }, [hCaptchaStatus, handleClose])

  const onMessage = useCallback(
    (event: NativeSyntheticEvent<HCaptchaMessage>) => {
      if (!hasMessageFired) {
        hasMessageFired = true
        if (event && event.nativeEvent.data && !hasCode) {
          setHasCode(true)
          const code = event.nativeEvent.data
          if (['cancel', 'error', 'expired'].includes(code)) {
            handleClose()
          } else {
            dispatch(updateHCaptchaScore({ token: code }))
          }
        }
      }
    },
    [hasCode, handleClose, dispatch]
  )

  return isOpen ? (
    <ConfirmHcaptcha
      size='normal'
      ref={ref}
      siteKey={siteKey}
      baseUrl={baseUrl}
      onMessage={onMessage}
      languageCode='en'
    />
  ) : null
}

export default HCaptchaModal
