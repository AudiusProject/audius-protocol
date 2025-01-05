import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { TouchableOpacity } from 'react-native'

import { IconRobot } from '@audius/harmony-native'
import { MusicBadge } from 'app/harmony-native/components/MusicBadge/MusicBadge'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  aiGenerated: 'AI Generated'
}

export const DetailsTileAiAttribution = ({ userId }: { userId: ID }) => {
  const navigation = useNavigation()
  const { data: user } = useUser(userId)

  const handlePress = () => {
    navigation.navigate('AiGeneratedTracks', { userId })
  }

  return user ? (
    <TouchableOpacity onPress={handlePress}>
      <MusicBadge icon={IconRobot} color='aiGreen'>
        {messages.aiGenerated}
      </MusicBadge>
    </TouchableOpacity>
  ) : null
}
