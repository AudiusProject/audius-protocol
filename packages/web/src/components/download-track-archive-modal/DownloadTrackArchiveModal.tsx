import { useCallback, useEffect } from 'react'

import {
  useCancelStemsArchiveJob,
  useDownloadTrackStems,
  useGetStemsArchiveJobStatus
} from '@audius/common/api'
import { useDownloadTrackArchiveModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  Text,
  Flex,
  LoadingSpinner,
  IconFolder,
  ModalTitle,
  IconReceive,
  Hint,
  IconError,
  TextLink
} from '@audius/harmony'

import { env } from 'services/env'

const messages = {
  title: 'Preparing Download',
  zippingFiles: (count: number) => `Zipping files (${count})`,
  error: 'Something went wrong. Please check your connection and try again.',
  tryAgain: 'Try again.'
}

const triggerDownload = (url: string) => {
  if (document) {
    const link = document.createElement('a')
    link.href = url
    link.click()
    link.remove()
  } else {
    throw new Error('No document found')
  }
}

export const DownloadTrackArchiveModal = () => {
  const {
    data: { trackId, fileCount },
    isOpen,
    onClose,
    onClosed
  } = useDownloadTrackArchiveModal()

  const {
    mutate: downloadTrackStems,
    isError: initiateDownloadFailed,
    isPending: isStartingDownload,
    data: { id: jobId } = {}
  } = useDownloadTrackStems({
    trackId
  })

  const { mutate: cancelStemsArchiveJob } = useCancelStemsArchiveJob()

  const { data: jobState } = useGetStemsArchiveJobStatus({
    jobId
  })

  const hasError =
    !isStartingDownload &&
    (initiateDownloadFailed || jobState?.state === 'failed')

  useEffect(() => {
    if (isOpen) {
      downloadTrackStems()
    }
  }, [isOpen, downloadTrackStems, trackId])

  useEffect(() => {
    if (jobState?.state === 'completed') {
      triggerDownload(`${env.ARCHIVE_ENDPOINT}/archive/stems/download/${jobId}`)
      onClose()
    }
  }, [jobState, onClose, jobId])

  const handleClose = useCallback(() => {
    if (jobId) {
      cancelStemsArchiveJob({ jobId })
    }
    onClose()
  }, [onClose, jobId, cancelStemsArchiveJob])

  const handleRetry = useCallback(() => {
    downloadTrackStems()
  }, [downloadTrackStems])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      dismissOnClickOutside={false}
      size='small'
    >
      <ModalHeader>
        <ModalTitle title={messages.title} Icon={IconReceive} />
      </ModalHeader>
      <ModalContent>
        <Flex
          justifyContent='center'
          alignItems='center'
          direction='column'
          gap='xl'
        >
          <Flex alignItems='center' gap='l'>
            <IconFolder color='default' size='l' />
            <Text variant='body' size='l' strength='strong'>
              {messages.zippingFiles(fileCount)}
            </Text>
          </Flex>
          {hasError ? (
            <Hint
              icon={IconError}
              border='strong'
              actions={
                <TextLink variant='visible' onClick={handleRetry}>
                  {messages.tryAgain}
                </TextLink>
              }
            >
              {messages.error}
            </Hint>
          ) : (
            <LoadingSpinner size='l' />
          )}
        </Flex>
      </ModalContent>
    </Modal>
  )
}
