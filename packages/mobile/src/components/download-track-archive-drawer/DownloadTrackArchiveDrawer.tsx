import { useCallback, useEffect } from 'react'

import {
  useCancelStemsArchiveJob,
  useDownloadTrackStems,
  useGetStemsArchiveJobStatus
} from '@audius/common/api'
import { useDownloadTrackArchiveModal } from '@audius/common/store'

import {
  Flex,
  Hint,
  IconError,
  IconFolder,
  IconReceive,
  Text,
  TextLink
} from '@audius/harmony-native'
import Drawer from 'app/components/drawer'

import { HarmonyModalHeader } from '../core/HarmonyModalHeader'
import LoadingSpinner from '../loading-spinner'

const messages = {
  title: 'Preparing Download',
  zippingFiles: (count: number) => `Zipping files (${count})`,
  error: 'Something went wrong. Please check your connection and try again.',
  tryAgain: 'Try again.'
}

export const DownloadTrackArchiveDrawer = () => {
  const {
    data: { trackId, fileCount },
    isOpen,
    onClose,
    onClosed
  } = useDownloadTrackArchiveModal()

  const {
    mutate: downloadTrackStems,
    isError: initiateDownloadFailed,
    error: initiateDownloadError,
    isPending: isStartingDownload,
    data: { id: jobId } = {}
  } = useDownloadTrackStems({
    trackId
  })

  if (initiateDownloadError) {
    console.error(initiateDownloadError)
  }

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
      // TODO: Native version of this
      // triggerDownload(`${env.ARCHIVE_ENDPOINT}/archive/stems/download/${jobId}`)
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
    <Drawer isOpen={isOpen} onClose={handleClose} onClosed={onClosed}>
      <Flex ph='l' pv='xl' gap='xl'>
        <HarmonyModalHeader icon={IconReceive} title={messages.title} />
        <Flex justifyContent='center' alignItems='center' gap='xl'>
          <Flex row alignItems='center' gap='l'>
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
                <TextLink variant='visible' onPress={handleRetry}>
                  {messages.tryAgain}
                </TextLink>
              }
            >
              {messages.error}
            </Hint>
          ) : (
            <LoadingSpinner />
          )}
        </Flex>
      </Flex>
    </Drawer>
  )
}
