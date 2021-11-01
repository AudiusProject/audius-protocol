import React, { useCallback } from 'react'

import { StyleSheet, View } from 'react-native'

import IconNotification from '../../assets/images/iconGradientNotification.svg'
import IconHeart from '../../assets/images/iconHeart.svg'
import IconRepost from '../../assets/images/iconRepost.svg'
import IconRemix from '../../assets/images/iconRemix.svg'
import IconExploreNewReleases from '../../assets/images/iconExploreNewReleases.svg'
import IconFollow from '../../assets/images/iconFollow.svg'
import IconCoSign from '../../assets/images/iconCoSign.svg'

import Button from '../../components/button'
import Drawer from '../../components/drawer'
import Text from '../../components/text'

// Importing directly from audius-client temporarily until
// settings page is migrated because we still need push notification logic to work
// on settings page and it doesn't necessarily make sense in common
import { togglePushNotificationSetting } from 'audius-client/src/containers/settings-page/store/actions'
import { PushNotificationSetting } from 'audius-client/src/containers/settings-page/store/types'

import { useDrawer } from '../../hooks/useDrawer'
import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'
import { useThemeColors } from '../../utils/theme'
import LinearGradient from 'react-native-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import { useDispatchWeb } from '../../hooks/useDispatchWeb'

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
    icon: IconExploreNewReleases
  }
]

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    drawer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      paddingTop: 32,
      paddingBottom: 64
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
    },

    button: {
      width: '100%'
    }
  })

const EnablePushNotificationsDrawer = () => {
  const dispatchWeb = useDispatchWeb()
  const [isOpen, setIsOpen] = useDrawer('EnablePushNotifications')
  const styles = useThemedStyles(createStyles)
  const {
    background,
    neutralLight2,
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const enablePushNotifications = useCallback(() => {
    dispatchWeb(
      togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
    )
    onClose()
  }, [dispatchWeb, onClose])

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <View style={styles.drawer}>
        <View style={styles.top}>
          <IconNotification
            height={66}
            width={66}
            fill={pageHeaderGradientColor2}
            fillSecondary={pageHeaderGradientColor1}
          />
          <MaskedView
            maskElement={
              <Text style={styles.cta} weight='heavy'>
                {messages.dontMiss}
              </Text>
            }
          >
            <LinearGradient
              colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
            >
              <Text style={[styles.cta, { opacity: 0 }]} weight='heavy'>
                {messages.dontMiss}
              </Text>
            </LinearGradient>
          </MaskedView>
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
          style={styles.button}
        />
      </View>
    </Drawer>
  )
}

export default EnablePushNotificationsDrawer
