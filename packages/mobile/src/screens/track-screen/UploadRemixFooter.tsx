import React, { useCallback } from 'react'

import type { ID } from '@audius/common/models'

import { Button, Flex, IconCloudUpload } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  uploadRemixButtonText: 'Upload Your Remix'
}

type UploadRemixFooterProps = {
  trackId: ID
}

/**
 * Footer component for uploading remixes in the remix contest section
 */
export const UploadRemixFooter = ({ trackId }: UploadRemixFooterProps) => {
  const navigation = useNavigation()

  const handlePressSubmitRemix = useCallback(() => {
    if (!trackId) return
    navigation.push('Upload', {
      initialMetadata: {
        is_remix: true,
        remix_of: {
          tracks: [{ parent_track_id: trackId }]
        }
      }
    })
  }, [navigation, trackId])

  return (
    <Flex
      borderTop='default'
      pv='l'
      ph='xl'
      alignItems='center'
      justifyContent='center'
    >
      <Button
        variant='secondary'
        size='small'
        iconLeft={IconCloudUpload}
        onPress={handlePressSubmitRemix}
        fullWidth
      >
        {messages.uploadRemixButtonText}
      </Button>
    </Flex>
  )
}
