import { useCallback } from 'react'

// Importing directly from audius-client temporarily until
// settings page is migrated because we still need push notification logic to work
// on settings page and it doesn't necessarily make sense in common
import { settingsPageActions, PushNotificationSetting } from '@audius/common'
import { StyleSheet, View } from 'react-native'

import IconCoSign from 'app/assets/images/iconCoSign.svg'
import IconFollow from 'app/assets/images/iconFollow.svg'
import IconNotification from 'app/assets/images/iconGradientNotification.svg'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconNewReleases from 'app/assets/images/iconNewReleases.svg'
import IconRemix from 'app/assets/images/iconRemix.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import { Button, GradientText } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useDrawer } from 'app/hooks/useDrawer'
import type { ThemeColors } from 'app/hooks/useThemedStyles'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
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
    icon: IconFollow
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
  }
]

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    drawer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      padding: 16,
      paddingTop: 64,
      paddingBottom: 32
    },

    cta: {
      marginTop: 16,
      fontSize: 28
    },

    turnOn: {
      color: themeColors.neutral,
      fontSize: 24,
      lineHeight: 29,
      marginTop: 4
    },

    top: {
      marginBottom: 32,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },

    actions: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 32
    },

    action: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    },

    actionText: {
      fontSize: 24,
      color: themeColors.neutralLight2
    },

    actionIcon: {
      marginRight: 16
    }
  })

export const EnablePushNotificationsDrawer = () => {
  const dispatchWeb = useDispatchWeb()
  const { onClose } = useDrawer('EnablePushNotifications')
  const styles = useThemedStyles(createStyles)
  const {
    background,
    neutralLight2,
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  const enablePushNotifications = useCallback(() => {
    dispatchWeb(
      togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
    )
    onClose()
  }, [dispatchWeb, onClose])

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
