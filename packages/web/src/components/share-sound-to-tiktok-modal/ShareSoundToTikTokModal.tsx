import { useCallback, useMemo } from 'react'

import {
  Nullable,
  ShareSoundToTiktokModalStatus,
  shareSoundToTiktokModalActions,
  shareSoundToTiktokModalSelectors
} from '@audius/common'
import {
  Button,
  Modal,
  ButtonType,
  IconTikTokInverted,
  IconTikTok
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import Drawer from 'components/drawer/Drawer'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useTikTokAuth } from 'hooks/useTikTokAuth'
import { useIsMobile } from 'utils/clientUtil'

import styles from './ShareSoundToTikTokModal.module.css'
const { getStatus, getTrack } = shareSoundToTiktokModalSelectors
const { authenticated, setStatus, share } = shareSoundToTiktokModalActions

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
  const isMobile = useIsMobile()

  const [isOpen, setIsOpen] = useModalState('ShareSoundToTikTok')
  const dispatch = useDispatch()

  const track = useSelector(getTrack)
  const status = useSelector(getStatus)

  const withTikTokAuth = useTikTokAuth({
    onError: () =>
      dispatch(setStatus({ status: ShareSoundToTiktokModalStatus.SHARE_ERROR }))
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
      withTikTokAuth((accessToken, openId) =>
        dispatch(authenticated({ accessToken, openId }))
      )
    }
  }

  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen])

  const renderMessage = () => {
    const hasError =
      fileRequirementError !== null ||
      status === ShareSoundToTiktokModalStatus.SHARE_ERROR

    const rawMessage = {
      [ShareSoundToTiktokModalStatus.SHARE_STARTED]: messages.inProgress,
      [ShareSoundToTiktokModalStatus.SHARE_SUCCESS]: messages.success,
      [ShareSoundToTiktokModalStatus.SHARE_ERROR]: messages.error,
      [ShareSoundToTiktokModalStatus.SHARE_UNINITIALIZED]: messages.confirmation
    }[status as ShareSoundToTiktokModalStatus]

    if (hasError) {
      const errorMessage =
        status === ShareSoundToTiktokModalStatus.SHARE_ERROR
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
    if (status === ShareSoundToTiktokModalStatus.SHARE_SUCCESS) {
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

  return isMobile ? (
    <Drawer onClose={handleClose} isOpen={isOpen}>
      <div className={cn(styles.modalContent, styles.mobile)}>
        <div className={cn(styles.modalHeader, styles.mobile)}>
          <div className={cn(styles.titleContainer, styles.mobile)}>
            <IconTikTok />
            <div>{messages.title}</div>
          </div>
        </div>
        {renderMessage()}
        {status === ShareSoundToTiktokModalStatus.SHARE_STARTED ? (
          <LoadingSpinner />
        ) : (
          renderButton()
        )}
      </div>
    </Drawer>
  ) : (
    <Modal
      allowScroll={false}
      bodyClassName={styles.modalBody}
      dismissOnClickOutside={
        status !== ShareSoundToTiktokModalStatus.SHARE_STARTED
      }
      headerContainerClassName={styles.modalHeader}
      isOpen={isOpen}
      onClose={handleClose}
      showTitleHeader
      showDismissButton
      title={
        <div className={styles.titleContainer}>
          <IconTikTok />
          <div>{messages.title}</div>
        </div>
      }
    >
      <div className={styles.modalContent}>
        {renderMessage()}
        {status === ShareSoundToTiktokModalStatus.SHARE_STARTED ? (
          <LoadingSpinner />
        ) : (
          renderButton()
        )}
      </div>
    </Modal>
  )
}

export default ShareSoundToTikTokModal
