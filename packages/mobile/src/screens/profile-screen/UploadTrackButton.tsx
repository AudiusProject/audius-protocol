import { useCallback } from 'react'

import { IconCloudUpload, Button, Flex } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  uploadTrack: 'Upload a Track'
}

export const UploadTrackButton = () => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.push('Upload')
  }, [navigation])

  return (
    <Flex pointerEvents='box-none' mt='xs'>
      <Button
        variant='secondary'
        iconLeft={IconCloudUpload}
        size='small'
        fullWidth
        onPress={handlePress}
      >
        {messages.uploadTrack}
      </Button>
    </Flex>
  )
}
