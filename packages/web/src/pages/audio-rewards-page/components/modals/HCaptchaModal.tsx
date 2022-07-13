import { useCallback } from 'react'

import HCaptcha from '@hcaptcha/react-hcaptcha'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import {
  HCaptchaStatus,
  setHCaptchaStatus
} from 'common/store/pages/audio-rewards/slice'
import AudiusBackend from 'services/AudiusBackend'

import styles from './HCaptchaModal.module.css'
import ModalDrawer from './ModalDrawer'

const sitekey = process.env.REACT_APP_HCAPTCHA_SITE_KEY

const messages = {
  title: 'Complete Captcha Verification'
}

export const HCaptchaModal = () => {
  const [isOpen, setOpen] = useModalState('HCaptcha')
  const dispatch = useDispatch()

  const handleClose = useCallback(
    (userInitiated = true) => {
      if (userInitiated) {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.USER_CLOSED }))
      }
      setOpen(false)
    },
    [setOpen, dispatch]
  )

  const onVerify = useCallback(
    async (token: string) => {
      const result = await AudiusBackend.updateHCaptchaScore(token)
      if (result.error) {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
      } else {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
      }
      handleClose(false)
    },
    [dispatch, handleClose]
  )

  return sitekey ? (
    <ModalDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={messages.title}
      showTitleHeader
      dismissOnClickOutside
      showDismissButton
      bodyClassName={styles.modalBody}>
      <HCaptcha sitekey={sitekey} onVerify={onVerify} />
    </ModalDrawer>
  ) : null
}

export default HCaptchaModal
