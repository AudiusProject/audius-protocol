import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { aiPageActions, aiPageSelectors } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconRobot } from '@audius/harmony-native'
import { MusicBadge } from 'app/harmony-native/components/MusicBadge/MusicBadge'
import { useNavigation } from 'app/hooks/useNavigation'

const { fetchAiUser, reset } = aiPageActions
const { getAiUser } = aiPageSelectors

const messages = {
  aiGenerated: 'AI Generated'
}

export const DetailsTileAiAttribution = ({ userId }: { userId: ID }) => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const user = useSelector(getAiUser)

  useEffect(() => {
    dispatch(fetchAiUser({ userId }))
    return function cleanup() {
      dispatch(reset())
    }
  }, [dispatch, userId])

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
