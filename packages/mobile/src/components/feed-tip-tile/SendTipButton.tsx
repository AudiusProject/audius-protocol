import { useCallback, useState } from 'react'

import { User } from 'audius-client/src/common/models/User'
import { beginTip } from 'audius-client/src/common/store/tipping/slice'
import { View } from 'react-native'

import { Text, Button } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const messages = {
  sendTipToPrefix: 'SEND TIP TO '
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  sendTipButton: {
    marginTop: spacing(4)
  },
  sendTipButtonTitleContainer: {
    display: 'flex',
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

export const SendTipButton = ({ receiver }: SendTipButtonProps) => {
  const styles = useStyles()
  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()
  const [isActive, setIsActive] = useState(false)

  const handlePress = useCallback(() => {
    dispatchWeb(beginTip({ user: receiver, source: 'feed' }))
    navigation.navigate({ native: { screen: 'TipArtist' } })
  }, [dispatchWeb, receiver, navigation])

  const handlePressIn = useCallback(() => {
    setIsActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setIsActive(false)
  }, [])

  return (
    <View style={styles.sendTipButton}>
      <Button
        // @ts-ignore: react native title wants string but we need Element
        title={
          <View style={styles.sendTipButtonTitleContainer}>
            <Text
              style={
                isActive
                  ? [styles.sendTipButtonTitle, styles.textWhite]
                  : styles.sendTipButtonTitle
              }>
              {messages.sendTipToPrefix}
            </Text>
            <Text
              style={
                isActive
                  ? [styles.buttonReceiverName, styles.textWhite]
                  : styles.buttonReceiverName
              }
              numberOfLines={1}>
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
