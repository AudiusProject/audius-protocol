import React, { useCallback, useState } from 'react'

import { Button, ButtonType, Modal } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { getModalVisibility } from 'common/store/ui/modals/slice'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { confirmTransferAudioToWAudio } from 'store/audio-manager/slice'
import { useSelector } from 'utils/reducer'

import { messages } from '../utils'

import styles from './ConfirmAudioToWAudioModal.module.css'

/**
 * Modal body for loading text while waiting to confirm
 */
const LoadingBody = () => {
  return (
    <div className={styles.body}>
      <div className={cn(styles.bodyText, styles.loadingTitle)}>
        <i
          className={cn(
            'emoji',
            'large',
            'raised-hand',
            styles.raisedHandEmoji
          )}
        />
        {messages.loadingTitle}
      </div>
      <div className={cn(styles.bodyText, styles.loadingBody)}>
        {messages.loadingBody}
      </div>
      <LoadingSpinner className={styles.loadingSpinner} />
    </div>
  )
}

/**
 * Modal body w/ cta for user to confirm converting $AUDIO to $WAUDIO
 */
const CTABody = ({ onConfirm }: { onConfirm: () => void }) => {
  return (
    <div className={styles.body}>
      <div className={styles.header}>{messages.header}</div>
      <div className={styles.bodyText}>{messages.description}</div>
      <a className={styles.moreInfo}>{messages.moreInfo}</a>
      <Button
        type={ButtonType.PRIMARY_ALT}
        className={styles.btn}
        textClassName={styles.btnText}
        onClick={onConfirm}
        text={messages.confirm}
      />
    </div>
  )
}

type AudioToWAudioMobileDrawerProps = {
  isOpen: boolean
  isLoading: boolean
  onConfirm: () => void
  onClose: () => void
}

const ConfirmAudioToWAudioModal = () => {
  const dispatch = useDispatch()

  const isOpen = useSelector(state =>
    getModalVisibility(state, 'ConfirmAudioToWAudio')
  )
  const [isLoading, setIsLoading] = useState(false)

  const onConfirm = useCallback(() => {
    setIsLoading(true)
    dispatch(confirmTransferAudioToWAudio())
  }, [setIsLoading, dispatch])

  const onClose = useCallback(() => {}, [])

  const body = isLoading ? <LoadingBody /> : <CTABody onConfirm={onConfirm} />

  return (
    <Modal
      isOpen={isOpen}
      showTitleHeader
      titleClassName={styles.modalTitle}
      bodyClassName={styles.modalBody}
      onClose={onClose}
      title={
        <>
          {messages.title}
          <i className={cn('emoji', 'woman-surfing', styles.titleEmoji)} />
        </>
      }
      allowScroll={false}
      dismissOnClickOutside={false}
      showDismissButton={false}
    >
      {body}
    </Modal>
  )
}

export default ConfirmAudioToWAudioModal
