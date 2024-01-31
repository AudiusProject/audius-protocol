import {
  accountSelectors,
  recoveryEmailActions,
  recoveryEmailSelectors,
  modalsActions
} from '@audius/common/store'
import { useCallback, useEffect } from 'react'

import { Status } from '@audius/common/models'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconKey from 'app/assets/images/iconKey.svg'
import IconRecoveryEmail from 'app/assets/images/iconRecoveryEmail.svg'
import IconSignOut from 'app/assets/images/iconSignOut.svg'
import IconSkull from 'app/assets/images/iconSkull.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { ScrollView, Screen, ScreenContent } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { useNavigation } from 'app/hooks/useNavigation'
import { useToast } from 'app/hooks/useToast'
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
  recoveryButtonTitle: 'Resend Recovery Email',
  recoveryEmailSent: 'Recovery Email Sent!',
  recoveryEmailNotSent: 'Unable to send recovery email. Please try again!',
  verifyTitle: 'Verification',
  verifyDescription:
    'Verify your Audius profile by linking a verified account from Twitter, Instagram, or TikTok.',
  verifyButtonTitle: 'Get Verified!',
  passwordTitle: 'Change Password',
  passwordDescription: 'Change the password to your Audius account.',
  passwordButtonTitle: 'Change Password',
  signOutTitle: 'Sign Out',
  signOutDescription: 'Sign out of your Audius Account.',
  signOutButtonTitle: 'Sign Out',
  deleteAccountTitle: 'Delete Account',
  deleteAccountDescription: 'Delete your account. This cannot be undone',
  deleteAccountButtonTitle: 'Delete Account'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  header: {
    alignItems: 'center',
    paddingVertical: spacing(8)
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
  const { toast } = useToast()
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
    navigation.push('AccountVerificationScreen')
  }, [navigation])

  const handlePressChangePassword = useCallback(() => {
    navigation.push('ChangePasswordScreen')
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
    <Screen
      title={messages.title}
      icon={IconUser}
      topbarRight={null}
      variant='secondary'
    >
      <ScreenContent>
        <ScrollView>
          <View style={styles.header}>
            <ProfilePicture profile={accountUser} style={styles.profilePhoto} />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.handle}>@{handle}</Text>
          </View>
          <AccountSettingsItem
            title={messages.recoveryTitle}
            titleIcon={IconRecoveryEmail}
            description={messages.recoveryDescription}
            buttonTitle={messages.recoveryButtonTitle}
            onPress={handlePressRecoveryEmail}
          />
          <AccountSettingsItem
            title={messages.verifyTitle}
            titleIcon={IconVerified}
            description={messages.verifyDescription}
            buttonTitle={messages.verifyButtonTitle}
            onPress={handlePressVerification}
          />
          <AccountSettingsItem
            title={messages.passwordTitle}
            titleIcon={IconKey}
            description={messages.passwordDescription}
            buttonTitle={messages.passwordButtonTitle}
            onPress={handlePressChangePassword}
          />
          <AccountSettingsItem
            title={messages.signOutTitle}
            titleIcon={IconSignOut}
            description={messages.signOutDescription}
            buttonTitle={messages.signOutButtonTitle}
            onPress={openSignOutDrawer}
          />
          <AccountSettingsItem
            title={messages.deleteAccountTitle}
            titleIcon={IconSkull}
            description={messages.deleteAccountDescription}
            buttonTitle={messages.deleteAccountButtonTitle}
            onPress={openDeactivateAccountDrawer}
          />
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
