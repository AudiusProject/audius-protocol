import { useReplaceTrackProgressModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  Text,
  Flex,
  IconAudiusLogo,
  ProgressBar,
  IconValidationCheck,
  LoadingSpinner
} from '@audius/harmony'

const messages = {
  description:
    'Please hold on while we upload and replace the file for this track.',
  inProgress: 'Upload in progress',
  finalizing: 'Finalizing...'
}

export const ReplaceTrackProgressModal = () => {
  const { data, isOpen, onClose } = useReplaceTrackProgressModal()
  const { progress } = data

  const uploadProgress = Math.min(progress.upload + progress.transcode, 2) / 2
  const isUploadComplete = uploadProgress >= 1

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalContent>
        <Flex direction='column' gap='unit14'>
          <Flex alignItems='center' direction='column' gap='xl'>
            <IconAudiusLogo height={48} width={48} color='default' />
            <Text variant='body' size='l'>
              {messages.description}
            </Text>
          </Flex>
          <Flex direction='column' gap='m'>
            <Flex justifyContent='space-between'>
              <Text variant='label' size='s'>
                {isUploadComplete ? messages.finalizing : messages.inProgress}
              </Text>
              <Flex alignItems='center' gap='l'>
                <Text variant='label' size='s'>
                  {Math.round(uploadProgress * 100)}%
                </Text>
                {isUploadComplete ? (
                  <IconValidationCheck size='s' />
                ) : (
                  <LoadingSpinner css={{ height: 16, width: 16 }} />
                )}
              </Flex>
            </Flex>
            <ProgressBar value={uploadProgress * 100} />
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
