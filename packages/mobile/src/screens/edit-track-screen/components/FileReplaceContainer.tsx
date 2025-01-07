import { useCallback, useContext } from 'react'

import type { ID } from '@audius/common/models'
import { Name } from '@audius/common/models'

import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  IconPause,
  IconPlay,
  PlainButton
} from '@audius/harmony-native'
import { EditTrackFormPreviewContext } from 'app/screens/edit-track-screen/EditTrackFormPreviewContext'
import { make, track as trackEvent } from 'app/services/analytics'

type FileReplaceContainerProps = {
  fileName: string
  filePath: string
  trackId: ID
  isUpload?: boolean
  downloadEnabled?: boolean
  onMenuButtonPress?: () => void
}

export const FileReplaceContainer = ({
  fileName,
  filePath,
  trackId,
  isUpload = false,
  onMenuButtonPress
}: FileReplaceContainerProps) => {
  const { isPlaying, playPreview, stopPreview } = useContext(
    EditTrackFormPreviewContext
  )

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      stopPreview()
    } else {
      playPreview(filePath)

      // Track Preview event
      trackEvent(
        make({
          eventName: Name.TRACK_REPLACE_PREVIEW,
          trackId,
          source: isUpload ? 'upload' : 'edit'
        })
      )
    }
  }, [filePath, isPlaying, isUpload, playPreview, stopPreview, trackId])

  return (
    <Flex
      direction='row'
      justifyContent='space-between'
      alignItems='center'
      gap='l'
    >
      <PlainButton
        size='default'
        style={{ flexShrink: 1, paddingRight: 8 }}
        iconLeft={isPlaying ? IconPause : IconPlay}
        onPress={handleTogglePlay}
      >
        {fileName}
      </PlainButton>
      <Flex>
        <IconButton icon={IconKebabHorizontal} onPress={onMenuButtonPress} />
      </Flex>
    </Flex>
  )
}
