import { useState, useContext, useCallback } from 'react'

import { Name, SquareSizes } from '@audius/common/models'
import {
  Button,
  IconVerified,
  IconRecoveryEmail,
  IconEmailAddress,
  IconKey,
  IconSignOut,
  Flex,
  Text,
  IconComponent,
  useTheme
} from '@audius/harmony'
import { Modal } from '@audius/stems'
import { debounce } from 'lodash'

import { make, useRecord } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import SignOutPage from 'components/nav/mobile/SignOut'
import { ToastContext } from 'components/toast/ToastContext'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  ACCOUNT_VERIFICATION_SETTINGS_PAGE,
  CHANGE_EMAIL_SETTINGS_PAGE,
  CHANGE_PASSWORD_SETTINGS_PAGE
} from 'utils/route'

import styles from './AccountSettingsPage.module.css'
import { SettingsPageProps } from './SettingsPage'
import settingsPageStyles from './SettingsPage.module.css'

const messages = {
  title: 'Account',
  recoveryTitle: 'Resend Recovery Email',
  recoveryDescription:
    'Store your recovery email safely. This email is the only way to recover your account if you forget your password.',
  recoveryButtonTitle: 'Resend Recovery Email',
  recoveryEmailSent: 'Recovery Email Sent!',
  recoveryEmailNotSent: 'Unable to send recovery email. Please try again!',
  verifyTitle: 'Verify Your Account',
  verifyDescription:
    'Verify your Audius profile by linking a verified account from Twitter, Instagram, or TikTok.',
  verifyButtonTitle: 'Get Verified!',
  verifyButtonTitleDisabled: `You're Verified!`,
  emailTitle: 'Change Email',
  emailDescription: 'Change the email you use to sign in and receive emails.',
  emailButtonTitle: 'Change Email',
  passwordTitle: 'Change Password',
  passwordDescription: 'Change the password to your Audius account.',
  passwordButtonTitle: 'Change Password',
  signOutTitle: 'Sign Out',
  signOutDescription: 'Sign out of your Audius Account.',
  signOutButtonTitle: 'Sign Out',
  deleteAccountTitle: 'Delete Account',
  deleteAccountDescription: 'Delete your account. This cannot be undone',
  deleteAccountButtonTitle: 'Delete Account',

  signOut:
    'Make sure you have your account recovery email stored somewhere safe before signing out!',
  emailSent: 'Email Sent!',
  emailNotSent: 'Something broke! Please try again!',
  holdUp: 'HOLD UP!'
}

type AccountSettingsItemProps = {
  title: string
  description: string
  icon: IconComponent
  buttonTitle: string
  disabled?: boolean
  onClick: () => void
}

const AccountSettingsItem = ({
  title,
  description,
  icon: Icon,
  buttonTitle,
  disabled,
  onClick
}: AccountSettingsItemProps) => {
  const { color } = useTheme()
  return (
    <Flex
      direction='column'
      ph='l'
      pv='m'
      gap='s'
      backgroundColor='white'
      w='100%'
      css={{
        borderTop: `1px solid ${color.border.default}`,
        '&:last-child': {
          borderBottom: `1px solid ${color.border.default}`
        }
      }}
    >
      <Flex alignItems='center' gap='s'>
        <Icon color='default' width={16} height={16} />
        <Text variant='title' strength='weak' size='s'>
          {title}
        </Text>
      </Flex>
      <Text
        variant='body'
        size='xs'
        textAlign='start'
        css={{ lineHeight: '166%' }}
      >
        {description}
      </Text>
      <Button
        variant='secondary'
        size='small'
        fullWidth
        onClick={onClick}
        disabled={disabled}
      >
        {buttonTitle}
      </Button>
    </Flex>
  )
}

const AccountSettingsPage = ({
  title,
  description,
  userId,
  name,
  handle,
  profilePictureSizes,
  goToRoute,
  isVerified
}: SettingsPageProps) => {
  const [showModalSignOut, setShowModalSignOut] = useState(false)
  const { toast } = useContext(ToastContext)

  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_480_BY_480
  )
  const record = useRecord()
  const onClickRecover = useCallback(
    () =>
      debounce(
        async () => {
          try {
            await audiusBackendInstance.sendRecoveryEmail()
            toast(messages.emailSent)
            record(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
          } catch (e) {
            toast(messages.emailNotSent)
          }
        },
        2000,
        { leading: true, trailing: false }
      )(),
    [toast, record]
  )

  const goToVerificationPage = useCallback(() => {
    goToRoute(ACCOUNT_VERIFICATION_SETTINGS_PAGE)
  }, [goToRoute])

  const goToChangePasswordSettingsPage = useCallback(() => {
    goToRoute(CHANGE_PASSWORD_SETTINGS_PAGE)
  }, [goToRoute])

  const goToChangeEmailSettingsPage = useCallback(() => {
    goToRoute(CHANGE_EMAIL_SETTINGS_PAGE)
  }, [goToRoute])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={settingsPageStyles.pageBackground}
    >
      <div className={settingsPageStyles.bodyContainer}>
        <div className={styles.account}>
          <DynamicImage
            image={profilePicture}
            wrapperClassName={styles.profilePicture}
          />
          <div className={styles.info}>
            <div className={styles.name}>{name}</div>
            <div className={styles.handle}>{`@${handle}`}</div>
          </div>
        </div>
        <AccountSettingsItem
          icon={IconRecoveryEmail}
          title={messages.recoveryTitle}
          description={messages.recoveryDescription}
          buttonTitle={messages.recoveryButtonTitle}
          onClick={onClickRecover}
        />
        <AccountSettingsItem
          icon={IconVerified}
          title={messages.verifyTitle}
          description={messages.verifyDescription}
          buttonTitle={
            !isVerified
              ? messages.verifyButtonTitle
              : messages.verifyButtonTitleDisabled
          }
          disabled={isVerified}
          onClick={goToVerificationPage}
        />
        <AccountSettingsItem
          icon={IconEmailAddress}
          title={messages.emailTitle}
          description={messages.emailDescription}
          buttonTitle={messages.emailButtonTitle}
          onClick={goToChangeEmailSettingsPage}
        />
        <AccountSettingsItem
          icon={IconKey}
          title={messages.passwordTitle}
          description={messages.passwordDescription}
          buttonTitle={messages.passwordButtonTitle}
          onClick={goToChangePasswordSettingsPage}
        />
        <AccountSettingsItem
          icon={IconSignOut}
          title={messages.signOutTitle}
          description={messages.signOutDescription}
          buttonTitle={messages.signOutButtonTitle}
          onClick={() => setShowModalSignOut(true)}
        />
        <Modal
          showTitleHeader
          showDismissButton
          title={messages.holdUp}
          isOpen={showModalSignOut}
          allowScroll={false}
          bodyClassName={styles.modal}
          onClose={() => setShowModalSignOut(false)}
        >
          <SignOutPage onClickBack={() => setShowModalSignOut(false)} />
        </Modal>
      </div>
    </MobilePageContainer>
  )
}

export default AccountSettingsPage
