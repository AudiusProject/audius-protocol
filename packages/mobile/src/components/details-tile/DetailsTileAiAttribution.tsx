import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { aiPageActions, aiPageSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { useColor } from 'app/utils/theme'

import { DetailsTileBadge } from './DetailsTileBadge'

const { fetchAiUser, reset } = aiPageActions
const { getAiUser } = aiPageSelectors

const messages = {
  aiGenerated: 'AI Generated'
}

export const DetailsTileAiAttribution = ({ userId }: { userId: ID }) => {
  const aiColor = useColor('aiPrimary')
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
    <DetailsTileBadge color={aiColor} onPress={handlePress}>
      {messages.aiGenerated}
    </DetailsTileBadge>
  ) : null
}
