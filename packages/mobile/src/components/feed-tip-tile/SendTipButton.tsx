import { useCallback, useState } from 'react'

import type { User } from '@audius/common/models'
import { tippingActions } from '@audius/common/store'
import { View, Platform } from 'react-native'
import { useDispatch } from 'react-redux'

import { Text, Button } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const { beginTip } = tippingActions

const messages = {
  sendTipToPrefix: 'SEND TIP TO ',
  sendAudioToPrefix: 'SEND $AUDIO TO ' // iOS only
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  sendTipButton: {
    marginTop: spacing(4)
  },
  sendTipButtonTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendTipButtonTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.neutralLight4
  },
  buttonReceiverName: {
    maxWidth: '68%',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.neutralLight4,
    textTransform: 'uppercase'
  },
  textWhite: {
    color: palette.white
  }
}))

type SendTipButtonProps = {
  receiver: User
}

export const SendTipButton = (props: SendTipButtonProps) => {
  const { receiver } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const [isActive, setIsActive] = useState(false)

  const handlePress = useCallback(() => {
    dispatch(beginTip({ user: receiver, source: 'feed' }))
    navigation.navigate('TipArtist')
  }, [dispatch, receiver, navigation])

  const handlePressIn = useCallback(() => {
    setIsActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setIsActive(false)
  }, [])

  return (
    <View style={styles.sendTipButton}>
      <Button
        title={
          <View style={styles.sendTipButtonTitleContainer}>
            <Text
              style={[styles.sendTipButtonTitle, isActive && styles.textWhite]}
            >
              {/* NOTE: Send tip -> Send $AUDIO change */}
              {Platform.OS === 'ios'
                ? messages.sendAudioToPrefix
                : messages.sendTipToPrefix}
            </Text>
            <Text
              style={[styles.buttonReceiverName, isActive && styles.textWhite]}
              numberOfLines={1}
            >
              {receiver.name}
            </Text>
            <UserBadges user={receiver} badgeSize={12} hideName />
          </View>
        }
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        size='small'
        variant='common'
        corners='pill'
        fullWidth
      />
    </View>
  )
}
