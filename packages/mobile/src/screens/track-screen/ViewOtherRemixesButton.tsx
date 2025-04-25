import { trackPageMessages as messages } from '@audius/common/messages'
import type { ID } from '@audius/common/models'

import { Button } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

type ViewOtherRemixesButtonProps = {
  parentTrackId: ID
}

export const ViewOtherRemixesButton = ({
  parentTrackId: trackId
}: ViewOtherRemixesButtonProps) => {
  const navigation = useNavigation()

  return (
    <Button
      style={{ alignSelf: 'flex-start' }}
      size='small'
      onPress={() => {
        navigation.navigate('TrackRemixes', { trackId })
      }}
    >
      {messages.viewOtherRemixes}
    </Button>
  )
}
