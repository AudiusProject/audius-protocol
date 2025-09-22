import { useCallback } from 'react'

import {
  settingsPageActions,
  PushNotificationSetting
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import {
  Flex,
  Text,
  IconCosign,
  IconUserFollow,
  IconNotificationOn,
  IconHeart,
  IconMessage,
  IconStars,
  IconRemix,
  IconRepost,
  Button
} from '@audius/harmony-native'
import { GradientIcon, GradientText } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
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
    icon: IconCosign
  },
  {
    label: messages.remixes,
    icon: IconRemix
  },
  {
    label: messages.newReleases,
    icon: IconStars
  },
  {
    label: messages.messages,
    icon: IconMessage
  }
]

export const EnablePushNotificationsDrawer = () => {
  const dispatch = useDispatch()
  const { onClose } = useDrawer('EnablePushNotifications')

  const enablePushNotifications = useCallback(() => {
    dispatch(
      togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
    )
    onClose()
  }, [dispatch, onClose])

  return (
    <NativeDrawer drawerName='EnablePushNotifications'>
      <Flex
        column
        justifyContent='space-evenly'
        pt='3xl'
        pb='2xl'
        ph='l'
        alignItems='center'
        gap='2xl'
      >
        <Flex column alignItems='center' gap='l'>
          <GradientIcon icon={IconNotificationOn} height={66} width={66} />
          <Flex column gap='xs' alignItems='center'>
            <GradientText style={{ fontSize: 28 }}>
              {messages.dontMiss}
            </GradientText>
            <Text variant='heading'>{messages.turnOn}</Text>
          </Flex>
        </Flex>
        <Flex column>
          {actions.map(({ label, icon: Icon }) => (
            <Flex row alignItems='center' mb='m' gap='l' key={label}>
              <Icon size='xl' color='default' colorSecondary='white' />
              <Text variant='title' size='l' color='default'>
                {label}
              </Text>
            </Flex>
          ))}
        </Flex>
        <Button onPress={enablePushNotifications} fullWidth>
          {messages.enable}
        </Button>
      </Flex>
    </NativeDrawer>
  )
}
