import { useCallback, useContext, useEffect } from 'react'

import {
  accountSelectors,
  recoveryEmailActions,
  recoveryEmailSelectors,
  modalsActions,
  Status
} from '@audius/common'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

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
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { AccountSettingsItem } from './AccountSettingsItem'
const { resendRecoveryEmail } = recoveryEmailActions
const { getRecoveryEmailStatus } = recoveryEmailSelectors
const { setVisibility } = modalsActions
const { getAccountUser } = accountSelectors

const messages = {
  title: 'Account',
  recoveryTitle: 'Recovery Email',
  recoveryDescription:
    'Store your recovery email safely. This email is the only way to recover your account if you forget your password.',
  recoveryButtonTitle: 'Resend',
  recoveryEmailSent: 'Recovery Email Sent!',
  recoveryEmailNotSent: 'Unable to send recovery email. Please try again!',
  verifyTitle: 'Get Verified',
  verifyDescription:
    'Get verified by linking a verified social account to Audius',
  verifyButtonTitle: 'Verification',
  passwordTitle: 'Change Password',
  passwordDescription: 'Change your password',
  passwordButtonTitle: 'Change',
  deactivateAccountTitle: 'Delete Account',
  deactivateAccountDescription: 'Delete your account. This cannot be undone',
  deactivateAccountButtonTitle: 'Delete',
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
  const dispatch = useDispatch()
  const accountUser = useSelector(getAccountUser)
  const recoveryEmailStatus = useSelector(getRecoveryEmailStatus)
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const handlePressRecoveryEmail = useCallback(() => {
    dispatch(resendRecoveryEmail())
  }, [dispatch])

  useEffect(() => {
    if (recoveryEmailStatus === Status.SUCCESS) {
      toast({ content: messages.recoveryEmailSent })
    }
    if (recoveryEmailStatus === Status.ERROR) {
      toast({ content: messages.recoveryEmailSent })
    }
  }, [recoveryEmailStatus, toast])

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
    dispatch(setVisibility({ modal: 'SignOutConfirmation', visible: true }))
  }, [dispatch])

  const openDeactivateAccountDrawer = useCallback(() => {
    dispatch(
      setVisibility({ modal: 'DeactivateAccountConfirmation', visible: true })
    )
  }, [dispatch])

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
