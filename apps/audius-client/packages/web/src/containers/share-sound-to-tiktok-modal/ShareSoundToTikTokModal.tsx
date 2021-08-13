import React, { useMemo } from 'react'

import {
  Button,
  Modal,
  ButtonType,
  IconTikTokInverted,
  IconTikTok,
  Anchor,
  ModalProps
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { MODAL_OFFSET_PIXELS } from 'components/action-sheet-modal/ActionSheetModal'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useModalState } from 'hooks/useModalState'
import { useTikTokAuth } from 'hooks/useTikTokAuth'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { Nullable } from 'utils/typeUtils'

import styles from './ShareSoundToTikTokModal.module.css'
import { getStatus, getTrack } from './store/selectors'
import { authenticated, setStatus, share } from './store/slice'
import { Status } from './store/types'

enum FileRequirementError {
  MIN_LENGTH,
  MAX_LENGTH
}

const messages = {
  completeButton: 'Done',
  confirmation: 'Are you sure you want to share "[Track Name]" to TikTok?',
  error: 'Something went wrong, please try again',
  errorMaxLength: 'Maximum Length for TikTok Sounds is 5 Minutes',
  errorMinLength: 'Minimum Length for TikTok Sounds is 10 Seconds',
  inProgress: 'Sharing "[Track Name]" to TikTok',
  shareButton: 'Share Sound to TikTok',
  success: '"[Track Name]" has been shared to TikTok!',
  title: 'Share to TikTok'
}

const fileRequirementErrorMessages = {
  [FileRequirementError.MAX_LENGTH]: messages.errorMaxLength,
  [FileRequirementError.MIN_LENGTH]: messages.errorMinLength
}

const ShareSoundToTikTokModal = () => {
  const mobile = isMobile()
  const wm = useWithMobileStyle(styles.mobile)

  const [isOpen, setIsOpen] = useModalState('ShareSoundToTikTok')
  const dispatch = useDispatch()

  const track = useSelector(getTrack)
  const status = useSelector(getStatus)

  const withTikTokAuth = useTikTokAuth({
    onError: () => dispatch(setStatus({ status: Status.SHARE_ERROR }))
  })

  const fileRequirementError: Nullable<FileRequirementError> = useMemo(() => {
    if (track) {
      if (track.duration > 300) {
        return FileRequirementError.MAX_LENGTH
      }
      if (track.duration < 10) {
        return FileRequirementError.MIN_LENGTH
      }
    }
    return null
  }, [track])

  const handleShareButtonClick = () => {
    if (track) {
      // Trigger the share process, which initially downloads the track to the client
      dispatch(share())

      // Trigger the authentication process
      withTikTokAuth(() => dispatch(authenticated()))
    }
  }

  const renderMessage = () => {
    const hasError =
      fileRequirementError !== null || status === Status.SHARE_ERROR

    const rawMessage = {
      [Status.SHARE_STARTED]: messages.inProgress,
      [Status.SHARE_SUCCESS]: messages.success,
      [Status.SHARE_ERROR]: messages.error,
      [Status.SHARE_UNINITIALIZED]: messages.confirmation
    }[status as Status]

    if (hasError) {
      const errorMessage =
        status === Status.SHARE_ERROR
          ? messages.error
          : fileRequirementErrorMessages[fileRequirementError!]

      return (
        <div className={cn(styles.message, styles.errorMessage)}>
          {errorMessage}
        </div>
      )
    } else {
      return (
        <div className={styles.message}>
          {rawMessage.replace('[Track Name]', track?.title ?? '')}
        </div>
      )
    }
  }

  const renderButton = () => {
    if (status === Status.SHARE_SUCCESS) {
      return (
        <Button
          className={styles.button}
          onClick={() => setIsOpen(false)}
          text={messages.completeButton}
        />
      )
    } else {
      const isButtonDisabled = fileRequirementError !== null
      return (
        <Button
          className={styles.button}
          type={isButtonDisabled ? ButtonType.DISABLED : ButtonType.PRIMARY}
          isDisabled={isButtonDisabled}
          onClick={handleShareButtonClick}
          text={
            <div className={styles.button}>
              <span>{messages.shareButton}</span>
              <IconTikTokInverted />
            </div>
          }
        />
      )
    }
  }

  const mobileProps: Partial<ModalProps> = {
    anchor: Anchor.BOTTOM,
    showDismissButton: false,
    verticalAnchorOffset: MODAL_OFFSET_PIXELS
  }

  return (
    <Modal
      allowScroll={false}
      bodyClassName={wm(styles.modalBody)}
      dismissOnClickOutside={status !== Status.SHARE_STARTED}
      headerContainerClassName={wm(styles.modalHeader)}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      showTitleHeader
      showDismissButton
      title={
        <div className={wm(styles.titleContainer)}>
          <IconTikTok />
          <div>{messages.title}</div>
        </div>
      }
      {...(mobile ? mobileProps : {})}
    >
      <div className={wm(styles.modalContent)}>
        {renderMessage()}
        {status === Status.SHARE_STARTED ? <LoadingSpinner /> : renderButton()}
      </div>
    </Modal>
  )
}

export default ShareSoundToTikTokModal
