import { useCallback } from 'react'

import { settingsPageActions, PushNotificationSetting } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  IconCoSign,
  IconUserFollow,
  IconNotification,
  IconHeart,
  IconMessage,
  IconNewReleases,
  IconRemix,
  IconRepost
} from '@audius/harmony-native'
import { Button, GradientText } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
const { togglePushNotificationSetting } = settingsPageActions

const messages = {
  dontMiss: "Don't Miss a Beat!",
  turnOn: 'Turn on Notifications',
  favorites: 'Favorites',
  reposts: 'Reposts',
  followers: 'Followers',
  coSigns: 'Co-Signs',
  remixes: 'Remixes',
  newReleases: 'New Releases',
  messages: 'Messages',
  enable: 'Enable Notifications'
}

const actions = [
  {
    label: messages.favorites,
    icon: IconHeart
  },
  {
    label: messages.reposts,
    icon: IconRepost
  },
  {
    label: messages.followers,
    icon: IconUserFollow
  },
  {
    label: messages.coSigns,
    icon: IconCoSign
  },
  {
    label: messages.remixes,
    icon: IconRemix
  },
  {
    label: messages.newReleases,
    icon: IconNewReleases
  },
  {
    label: messages.messages,
    icon: IconMessage
  }
]

const useStyles = makeStyles(({ palette, spacing }) => ({
  drawer: {
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    paddingTop: spacing(12),
    paddingBottom: spacing(8)
  },

  cta: {
    marginTop: spacing(4),
    fontSize: 28
  },

  turnOn: {
    color: palette.neutral,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 4
  },

  top: {
    marginBottom: spacing(8),
    flexDirection: 'column',
    alignItems: 'center'
  },

  actions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing(8)
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3)
  },

  actionText: {
    fontSize: 24,
    color: palette.neutralLight2
  },

  actionIcon: {
    marginRight: spacing(4)
  }
}))

export const EnablePushNotificationsDrawer = () => {
  const dispatch = useDispatch()
  const { onClose } = useDrawer('EnablePushNotifications')
  const styles = useStyles()

  const {
    background,
    neutralLight2,
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  const enablePushNotifications = useCallback(() => {
    dispatch(
      togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
    )
    onClose()
  }, [dispatch, onClose])

  return (
    <NativeDrawer drawerName='EnablePushNotifications'>
      <View style={styles.drawer}>
        <View style={styles.top}>
          <IconNotification
            height={66}
            width={66}
            fill={pageHeaderGradientColor2}
            fillSecondary={pageHeaderGradientColor1}
          />
          <GradientText style={styles.cta}>{messages.dontMiss}</GradientText>
          <Text style={styles.turnOn}>{messages.turnOn}</Text>
        </View>
        <View style={styles.actions}>
          {actions.map(({ label, icon: Icon }) => (
            <View style={styles.action} key={label}>
              <Icon
                height={30}
                width={30}
                fill={neutralLight2}
                fillSecondary={background}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText} weight='bold'>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <Button
          title={messages.enable}
          onPress={enablePushNotifications}
          size='large'
          fullWidth
        />
      </View>
    </NativeDrawer>
  )
}
