import { useReplaceTrackProgressModal } from '@audius/common/store'

import {
  Flex,
  IconAudiusLogo,
  IconValidationCheck,
  Text
} from '@audius/harmony-native'
import { AppDrawer } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProgressBar } from 'app/components/progress-bar'

const messages = {
  description:
    'Please hold on while we upload and replace the file for this track.',
  inProgress: 'Upload in progress',
  finalizing: 'Finalizing...',
  cancel: 'Cancel'
}

export const ReplaceTrackProgressDrawer = () => {
  const { data } = useReplaceTrackProgressModal()
  const { progress } = data

  const uploadProgress = Math.min(progress.upload + progress.transcode, 2) / 2
  const isUploadComplete = uploadProgress >= 1

  return (
    <AppDrawer modalName='ReplaceTrackProgress' isFullscreen>
      <Flex h='100%' justifyContent='center'>
        <Flex direction='column' gap='3xl' ph='2xl' pb='3xl'>
          <Flex alignItems='center' direction='column' gap='xl'>
            <IconAudiusLogo height={48} width={48} color='default' />
            <Text variant='body' size='l'>
              {messages.description}
            </Text>
          </Flex>
          <Flex direction='column'>
            <Flex justifyContent='space-between' direction='row'>
              <Text variant='label' size='s'>
                {isUploadComplete ? messages.finalizing : messages.inProgress}
              </Text>
              <Flex alignItems='center' gap='l' direction='row'>
                <Text variant='label' size='s'>
                  {Math.round(uploadProgress * 100)}%
                </Text>
                {isUploadComplete ? (
                  <IconValidationCheck size='s' />
                ) : (
                  <LoadingSpinner style={{ height: 16, width: 16 }} />
                )}
              </Flex>
            </Flex>
            <ProgressBar progress={uploadProgress} max={1} />
          </Flex>
        </Flex>
      </Flex>
    </AppDrawer>
  )
}
