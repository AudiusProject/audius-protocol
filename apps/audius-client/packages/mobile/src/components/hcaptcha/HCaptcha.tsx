import { useCallback, useEffect, useRef, useState } from 'react'

import HCaptcha from '@hcaptcha/react-native-hcaptcha'
import { getHCaptchaStatus } from 'audius-client/src/common/store/pages/audio-rewards/selectors'
import { HCaptchaStatus } from 'audius-client/src/common/store/pages/audio-rewards/slice'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import type { NativeSyntheticEvent } from 'react-native'
import Config from 'react-native-config'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'

type HCaptchaMessage = {
  data: string
}

type HCaptchaRef = {
  show: () => void
  hide: () => void
}

const siteKey = Config.HCAPTCHA_SITE_KEY
const baseUrl = Config.HCAPTCHA_BASE_URL

const HCAPTCHA_MODAL_NAME = 'HCaptcha'
const REWARD_MODAL_NAME = 'ChallengeRewardsExplainer'

// on clicking outside of the hcaptcha modal,
// the onMessage callback function gets triggered repeatedly,
// causing a stack overflow
// so we use this variable to prevent that from happening
let hasMessageFired = false

const HCaptchaModal = () => {
  const dispatchWeb = useDispatchWeb()
  const isOpen = useSelectorWeb((state) =>
    getModalVisibility(state, HCAPTCHA_MODAL_NAME)
  )
  const hCaptchaStatus = useSelectorWeb(getHCaptchaStatus)
  const ref = useRef<HCaptchaRef>(null)
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
    dispatchWeb(setVisibility({ modal: HCAPTCHA_MODAL_NAME, visible: false }))
    dispatchWeb(setVisibility({ modal: REWARD_MODAL_NAME, visible: true }))
  }, [dispatchWeb, hideHCaptcha])

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
            dispatchWeb({
              type: MessageType.UPDATE_HCAPTCHA_SCORE,
              token: code,
              isAction: true
            })
          }
        }
      }
    },
    [hasCode, handleClose, dispatchWeb]
  )

  return isOpen ? (
    <HCaptcha
      ref={ref}
      siteKey={siteKey}
      baseUrl={baseUrl}
      onMessage={onMessage}
      languageCode='en'
    />
  ) : null
}

export default HCaptchaModal
