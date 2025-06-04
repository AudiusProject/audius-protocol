import React, { useCallback } from 'react'

import { useUser, useTrack } from '@audius/common/api'
import { type ID } from '@audius/common/models'

import { Button, Flex, IconCloudUpload } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  contestEnded: 'Contest Ended',
  contestDeadline: 'Contest Deadline',
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
  const { data: originalTrack } = useTrack(trackId)
  const { data: originalUser } = useUser(originalTrack?.owner_id)

  const handlePressSubmitRemix = useCallback(async () => {
    if (!trackId) return

    const state = {
      initialMetadata: {
        genre: originalTrack?.genre ?? '',
        remix_of: {
          tracks: [
            {
              parent_track_id: trackId,
              user: originalUser,
              has_remix_author_reposted: false,
              has_remix_author_saved: false
            }
          ]
        }
      }
    }

    navigation.push('Upload', state)
  }, [navigation, originalTrack?.genre, originalUser, trackId])

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
