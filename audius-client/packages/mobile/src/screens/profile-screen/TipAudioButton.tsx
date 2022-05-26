import { useCallback } from 'react'

import { beginTip } from 'audius-client/src/common/store/tipping/slice'

import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import { Button } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'

import { useSelectProfile } from './selectors'

const messages = {
  title: 'Tip $AUDIO',
  label: 'Tip Audio tokens'
}

export const TipAudioButton = () => {
  const profile = useSelectProfile(['user_id'])
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()

  const handlePress = useCallback(() => {
    dispatchWeb(beginTip({ user: profile }))
    navigation.navigate({ native: { screen: 'TipArtist' } })
  }, [dispatchWeb, profile, navigation])

  return (
    <Button
      variant='primary'
      accessibilityLabel={messages.label}
      title={messages.title}
      icon={IconGoldBadge}
      iconPosition='left'
      fullWidth
      onPress={handlePress}
    />
  )
}
