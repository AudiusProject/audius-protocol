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
  LoadingSpinner
} from '@audius/harmony'

import { env } from 'services/env'

const messages = {
  title: 'Downloading Track Files',
  creatingArchive: 'Creating archive, this may take a minute...',
  error: 'Something went wrong, please try again.'
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
    data: { trackId },
    isOpen,
    onClose,
    onClosed
  } = useDownloadTrackArchiveModal()

  const { mutate: downloadTrackStems, data: { id: jobId } = {} } =
    useDownloadTrackStems({
      trackId
    })

  const { mutate: cancelStemsArchiveJob } = useCancelStemsArchiveJob()

  const { data: jobState } = useGetStemsArchiveJobStatus({
    jobId
  })

  const hasError = jobState?.state === 'failed'

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onClosed={onClosed}
      size='small'
    >
      <ModalHeader>
        <Flex alignSelf='center' gap='s'>
          <Text variant='label' size='xl' strength='strong'>
            {messages.title}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex
          justifyContent='center'
          alignItems='center'
          direction='column'
          gap='xl'
        >
          <Text variant='body' size='l'>
            {messages.creatingArchive}
          </Text>
          {hasError ? (
            <Text variant='body' color='danger'>
              {messages.error}
            </Text>
          ) : (
            <LoadingSpinner />
          )}
        </Flex>
      </ModalContent>
    </Modal>
  )
}
