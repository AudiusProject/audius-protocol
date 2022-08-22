import { useCallback, useContext } from 'react'

import {
  accountSelectors,
  recoveryEmailActions,
  modalsActions
} from '@audius/common'
import { Text, View } from 'react-native'

import Door from 'app/assets/images/emojis/door.png'
import Key from 'app/assets/images/emojis/key.png'
import Lock from 'app/assets/images/emojis/lock.png'
import StopSign from 'app/assets/images/emojis/octagonal-sign.png'
import Checkmark from 'app/assets/images/emojis/white-heavy-check-mark.png'
import IconMail from 'app/assets/images/iconMail.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import IconSignOut from 'app/assets/images/iconSignOut.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { ScrollView, Screen } from 'app/components/core'
import { ToastContext } from 'app/components/toast/ToastContext'
import { ProfilePicture } from 'app/components/user'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AccountSettingsItem } from './AccountSettingsItem'
const { resendRecoveryEmail } = recoveryEmailActions
const { setVisibility } = modalsActions
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  title: 'Account',
  recoveryTitle: 'Recovery Email',
  recoveryDescription:
    'Store your recovery email safely. This email is the only way to recover your account if you forget your password.',
  recoveryButtonTitle: 'Resend',
  recoveryEmailSent: 'Recovery Email Sent!',
  verifyTitle: 'Get Verified',
  verifyDescription:
    'Get verified by linking a verified social account to Audius',
  verifyButtonTitle: 'Verification',
  passwordTitle: 'Change Password',
  passwordDescription: 'Change your password',
  passwordButtonTitle: 'Change',
  deactivateAccountTitle: 'Deactivate Account',
  deactivateAccountDescription:
    'Deactivate your account. This cannot be undone',
  deactivateAccountButtonTitle: 'Deactivate',
  signOutTitle: 'Sign Out',
  signOutDescription:
    'Make sure you have your account recovery email stored somewhere safe before signing out!',
  signOutButtonTitle: 'Sign Out'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  header: {
    alignItems: 'center',
    paddingTop: spacing(12),
    paddingBottom: spacing(6)
  },
  profilePhoto: {
    height: 128,
    width: 128
  },
  name: { ...typography.h2, color: palette.neutral, marginTop: spacing(1) },
  handle: {
    ...typography.h2,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium
  }
}))

export const AccountSettingsScreen = () => {
  const styles = useStyles()
  const { toast } = useContext(ToastContext)
  const dispatchWeb = useDispatchWeb()
  const accountUser = useSelectorWeb(getAccountUser)
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePressRecoveryEmail = useCallback(() => {
    dispatchWeb(resendRecoveryEmail)
    toast({ content: messages.recoveryEmailSent })
  }, [dispatchWeb, toast])

  const handlePressVerification = useCallback(() => {
    navigation.push({
      native: { screen: 'AccountVerificationScreen' },
      web: { route: '/settings/account/verification' }
    })
  }, [navigation])

  const handlePressChangePassword = useCallback(() => {
    navigation.push({
      native: { screen: 'ChangePasswordScreen' },
      web: { route: '/settings/change-password' }
    })
  }, [navigation])

  const openSignOutDrawer = useCallback(() => {
    dispatchWeb(setVisibility({ modal: 'SignOutConfirmation', visible: true }))
  }, [dispatchWeb])

  const openDeactivateAccountDrawer = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: 'DeactivateAccountConfirmation', visible: true })
    )
  }, [dispatchWeb])

  if (!accountUser) return null

  const { name, handle } = accountUser

  return (
    <Screen title={messages.title} topbarRight={null} variant='secondary'>
      <ScrollView>
        <View style={styles.header}>
          <ProfilePicture profile={accountUser} style={styles.profilePhoto} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{handle}</Text>
        </View>
        <AccountSettingsItem
          title={messages.recoveryTitle}
          titleIconSource={Key}
          description={messages.recoveryDescription}
          buttonTitle={messages.recoveryButtonTitle}
          buttonIcon={IconMail}
          onPress={handlePressRecoveryEmail}
        />
        <AccountSettingsItem
          title={messages.verifyTitle}
          titleIconSource={Checkmark}
          description={messages.verifyDescription}
          buttonTitle={messages.verifyButtonTitle}
          buttonIcon={IconVerified}
          onPress={handlePressVerification}
        />
        <AccountSettingsItem
          title={messages.passwordTitle}
          titleIconSource={Lock}
          description={messages.passwordDescription}
          buttonTitle={messages.passwordButtonTitle}
          buttonIcon={IconMail}
          onPress={handlePressChangePassword}
        />
        <AccountSettingsItem
          title={messages.deactivateAccountTitle}
          titleIconSource={Door}
          description={messages.deactivateAccountDescription}
          buttonTitle={messages.deactivateAccountButtonTitle}
          buttonIcon={IconRemove}
          onPress={openDeactivateAccountDrawer}
        />
        <AccountSettingsItem
          title={messages.signOutTitle}
          titleIconSource={StopSign}
          description={messages.signOutDescription}
          buttonTitle={messages.signOutButtonTitle}
          buttonIcon={IconSignOut}
          onPress={openSignOutDrawer}
        />
      </ScrollView>
    </Screen>
  )
}
