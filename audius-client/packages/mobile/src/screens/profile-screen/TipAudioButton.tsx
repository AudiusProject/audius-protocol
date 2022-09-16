import { useCallback } from 'react'

import { tippingActions } from '@audius/common'
import { Platform } from 'react-native'
import { useDispatch } from 'react-redux'

import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from './selectors'
const { beginTip } = tippingActions

const messages = {
  title: 'Tip $AUDIO',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: 'Send $AUDIO', // iOS only
  label: 'Tip Audio tokens',
  labelAlt: 'Send Audio tokens' // iOS only
}

const useStyles = makeStyles(() => ({
  text: {
    fontSize: 16
  }
}))

export const TipAudioButton = () => {
  const navigation = useNavigation()
  const profile = useSelectProfile(['user_id'])
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(beginTip({ user: profile, source: 'profile' }))
    navigation.navigate('TipArtist')
  }, [dispatch, profile, navigation])

  const styles = useStyles()

  return (
    <Button
      variant='primary'
      accessibilityLabel={
        Platform.OS === 'ios' ? messages.labelAlt : messages.label
      }
      title={Platform.OS === 'ios' ? messages.titleAlt : messages.title}
      icon={IconGoldBadge}
      iconPosition='left'
      fullWidth
      onPress={handlePress}
      styles={{
        text: styles.text
      }}
    />
  )
}
