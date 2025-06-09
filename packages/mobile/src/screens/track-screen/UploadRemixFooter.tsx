import React, { useCallback } from 'react'

import { useUser, useTrack } from '@audius/common/api'
import { SquareSizes, type ID } from '@audius/common/models'

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

    let file: File | undefined
    const imageUrl = originalTrack?.artwork?.[SquareSizes.SIZE_480_BY_480] ?? ''

    if (imageUrl) {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      file = new File([blob], 'image.jpg', { type: blob.type })
    }

    const state = {
      initialMetadata: {
        ...(file
          ? {
              artwork: {
                url: imageUrl,
                file: {
                  // @ts-ignore: KJ - _data is on the file for some reason
                  ...file._data,
                  uri: imageUrl
                }
              }
            }
          : {}),
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
  }, [
    navigation,
    originalTrack?.artwork,
    originalTrack?.genre,
    originalUser,
    trackId
  ])

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
