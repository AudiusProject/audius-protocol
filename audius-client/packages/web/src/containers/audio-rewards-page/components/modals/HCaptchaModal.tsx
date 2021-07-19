import React, { useCallback } from 'react'

import HCaptcha from '@hcaptcha/react-hcaptcha'

import { useModalState } from 'hooks/useModalState'
import AudiusBackend from 'services/AudiusBackend'

import ModalDrawer from './ModalDrawer'

const sitekey = process.env.REACT_APP_HCAPTCHA_SITE_KEY

const messages = {
  title: 'Complete captcha verification'
}

export const HCaptchaModal = () => {
  const [isOpen, setOpen] = useModalState('HCaptcha')

  const onVerifyCaptcha = useCallback(
    (token: string) => {
      AudiusBackend.updateHCaptchaScore(token)
      setOpen(false)
    },
    [setOpen]
  )

  return sitekey ? (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={messages.title}
      showTitleHeader
      showDismissButton
    >
      <HCaptcha sitekey={sitekey} onVerify={onVerifyCaptcha} />
    </ModalDrawer>
  ) : null
}

export default HCaptchaModal
