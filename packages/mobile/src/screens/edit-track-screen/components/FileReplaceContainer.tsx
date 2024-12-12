import { useCallback, useContext } from 'react'

import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  IconPause,
  IconPlay,
  PlainButton
} from '@audius/harmony-native'
import { EditTrackFormPreviewContext } from 'app/screens/edit-track-screen/EditTrackFormPreviewContext'

type FileReplaceContainerProps = {
  fileName: string
  filePath: string
  downloadEnabled?: boolean
  onMenuButtonPress?: () => void
}

export const FileReplaceContainer = ({
  fileName,
  filePath,
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
    }
  }, [filePath, isPlaying, playPreview, stopPreview])

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
