import { useCallback } from 'react'

import { skipButtonMessages } from '@audius/common/messages'
import { finishSignUp } from '@audius/web/src/common/store/pages/signon/actions'
import { useDispatch } from 'react-redux'

import { PlainButton } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import type { SignOnScreenParamList } from '../types'

export const SkipButton = () => {
  const navigation = useNavigation<SignOnScreenParamList>()
  const dispatch = useDispatch()

  const handleSkip = useCallback(() => {
    dispatch(finishSignUp())
    navigation.navigate('AccountLoading')
  }, [dispatch, navigation])

  return (
    <PlainButton onPress={handleSkip}>
      {skipButtonMessages.skipThisStep}
    </PlainButton>
  )
}
