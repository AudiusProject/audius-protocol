import React, { useCallback } from 'react'

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

  // here, we can also instead use a prop e.g. onClose to handle re-opening the reward modal if we want to decouple rewards and hcaptcha
  const [, setRewardModalOpen] = useModalState('ChallengeRewardsExplainer')

  const handleClose = useCallback(() => {
    if (isOpen) {
      setRewardModalOpen(true)
      setOpen(false)
    }
  }, [setRewardModalOpen, isOpen, setOpen])

  const onVerify = useCallback(
    async (token: string) => {
      const result = await AudiusBackend.updateHCaptchaScore(token)
      if (result.error) {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
      } else {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
      }
      handleClose()
    },
    [dispatch, handleClose]
  )

  return sitekey ? (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => {
        dispatch(setHCaptchaStatus({ status: HCaptchaStatus.USER_CLOSED }))
        handleClose()
      }}
      title={messages.title}
      showTitleHeader
      dismissOnClickOutside
      showDismissButton
      bodyClassName={styles.modalBody}
    >
      <HCaptcha sitekey={sitekey} onVerify={onVerify} />
    </ModalDrawer>
  ) : null
}

export default HCaptchaModal
