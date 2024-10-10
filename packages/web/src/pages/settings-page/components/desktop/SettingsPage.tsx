import { useCallback, useEffect, useMemo, useState } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'
import { settingsMessages as messages } from '@audius/common/messages'
import { ID, Name, ProfilePictureSizes, Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  BrowserNotificationSetting,
  EmailFrequency,
  InstagramProfile,
  Notifications,
  TikTokProfile,
  TwitterProfile,
  settingsPageSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  IconAppearance,
  IconEmailAddress,
  IconKey,
  IconRecoveryEmail as IconMail,
  IconMessage,
  IconMessages,
  IconNotificationOn as IconNotification,
  IconReceive,
  IconRobot,
  IconSignOut,
  IconVerified,
  Modal,
  ModalContent,
  ModalContentText,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SegmentedControl
} from '@audius/harmony'
import cn from 'classnames'
import { Link } from 'react-router-dom'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import { ChangeEmailModal } from 'components/change-email/ChangeEmailModal'
import { ChangePasswordModal } from 'components/change-password/ChangePasswordModal'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import Toast from 'components/toast/Toast'
import { ComponentPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useFlag } from 'hooks/useRemoteConfig'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { env } from 'services/env'
import { isElectron } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'

import packageInfo from '../../../../../package.json'

import { AuthorizedAppsSettingsCard } from './AuthorizedApps'
import { DeveloperAppsSettingsCard } from './DeveloperApps'
import { AccountsManagingYouSettingsCard } from './ManagerMode/AccountsManagingYouSettingsCard'
import { AccountsYouManageSettingsCard } from './ManagerMode/AccountsYouManageSettingsCard'
import NotificationSettings from './NotificationSettings'
import { PayoutWalletSettingsCard } from './PayoutWallet/PayoutWalletSettingsCard'
import SettingsCard from './SettingsCard'
import styles from './SettingsPage.module.css'
import VerificationModal from './VerificationModal'

const {
  DOWNLOAD_LINK,
  PRIVACY_POLICY,
  PRIVATE_KEY_EXPORTER_SETTINGS_PAGE,
  TERMS_OF_SERVICE
} = route
const { getAllowAiAttribution } = settingsPageSelectors
const { version } = packageInfo

const EMAIL_TOAST_TIMEOUT = 2000

const isStaging = env.ENVIRONMENT === 'staging'

export type SettingsPageProps = {
  title: string
  description: string
  isVerified: boolean
  userId: ID
  handle: string
  name: string
  profilePictureSizes: ProfilePictureSizes | null
  theme: any
  toggleTheme: (theme: any) => void
  goToRoute: (route: string) => void
  notificationSettings: Notifications
  getNotificationSettings: () => void
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
  toggleBrowserPushNotificationPermissions: (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => void
  toggleNotificationSetting: (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => void
  emailFrequency: EmailFrequency
  updateEmailFrequency: (frequency: EmailFrequency) => void
  recordSignOut: (callback?: () => void) => void
  recordAccountRecovery: () => void
  recordDownloadDesktopApp: () => void
  showMatrix: boolean
  signOut: () => void
}

export const SettingsPage = (props: SettingsPageProps) => {
  const {
    getNotificationSettings,
    recordSignOut,
    signOut,
    recordAccountRecovery,
    recordDownloadDesktopApp,
    showMatrix,
    theme,
    title,
    description,
    toggleTheme,
    userId,
    handle,
    name,
    goToRoute,
    profilePictureSizes,
    isVerified,
    onInstagramLogin,
    onTikTokLogin,
    onTwitterLogin,
    toggleBrowserPushNotificationPermissions,
    toggleNotificationSetting,
    notificationSettings,
    updateEmailFrequency,
    emailFrequency
  } = props
  const isManagedAccount = useIsManagedAccount()

  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false)
  const [
    isNotificationSettingsModalVisible,
    setIsNotificationSettingsModalVisible
  ] = useState(false)
  const [isEmailToastVisible, setIsEmailToastVisible] = useState(false)
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false)
  const [isChangeEmailModalVisible, setIsChangeEmailModalVisible] =
    useState(false)
  const [emailToastText, setEmailToastText] = useState(messages.emailSent)
  const [, setIsInboxSettingsModalVisible] = useModalState('InboxSettings')
  const [, setIsCommentSettingsModalVisible] = useModalState('CommentSettings')
  const [, setIsAIAttributionSettingsModalVisible] = useModalState(
    'AiAttributionSettings'
  )

  useEffect(() => {
    getNotificationSettings()
  }, [getNotificationSettings])

  const openSignOutModal = useCallback(() => {
    setIsSignOutModalVisible(true)
  }, [setIsSignOutModalVisible])

  const closeSignOutModal = useCallback(() => {
    setIsSignOutModalVisible(false)
  }, [setIsSignOutModalVisible])

  const openNotificationSettings = useCallback(() => {
    setIsNotificationSettingsModalVisible(true)
  }, [setIsNotificationSettingsModalVisible])

  const closeNotificationSettings = useCallback(() => {
    setIsNotificationSettingsModalVisible(false)
  }, [setIsNotificationSettingsModalVisible])

  const handleSignOut = useCallback(() => {
    recordSignOut(signOut)
  }, [recordSignOut, signOut])

  const showEmailToast = useCallback(() => {
    const fn = async () => {
      try {
        await audiusBackendInstance.sendRecoveryEmail(handle)
        setEmailToastText(messages.emailSent)
        setIsEmailToastVisible(true)
        recordAccountRecovery()
      } catch (e) {
        console.error(e)
        setEmailToastText(messages.emailNotSent)
        setIsEmailToastVisible(true)
      }
      setTimeout(() => {
        setIsEmailToastVisible(false)
      }, EMAIL_TOAST_TIMEOUT)
    }
    fn()
  }, [handle, setIsEmailToastVisible, recordAccountRecovery, setEmailToastText])

  const handleDownloadDesktopAppClicked = useCallback(() => {
    recordDownloadDesktopApp()
    window.location.href = `https://audius.co${DOWNLOAD_LINK}`
  }, [recordDownloadDesktopApp])

  const openChangePasswordModal = useCallback(() => {
    setIsChangePasswordModalVisible(true)
  }, [setIsChangePasswordModalVisible])

  const closeChangePasswordModal = useCallback(() => {
    setIsChangePasswordModalVisible(false)
  }, [setIsChangePasswordModalVisible])

  const openChangeEmailModal = useCallback(() => {
    setIsChangeEmailModalVisible(true)
  }, [setIsChangeEmailModalVisible])

  const closeChangeEmailModal = useCallback(() => {
    setIsChangeEmailModalVisible(false)
  }, [setIsChangeEmailModalVisible])

  const openInboxSettingsModal = useCallback(() => {
    setIsInboxSettingsModalVisible(true)
  }, [setIsInboxSettingsModalVisible])

  const openCommentSettingsModal = useCallback(() => {
    setIsCommentSettingsModalVisible(true)
  }, [setIsCommentSettingsModalVisible])

  const openAiAttributionSettingsModal = useCallback(() => {
    setIsAIAttributionSettingsModalVisible(true)
  }, [setIsAIAttributionSettingsModalVisible])

  const record = useRecord()
  const recordExportPrivateKeyLinkClicked = useCallback(() => {
    record(make(Name.EXPORT_PRIVATE_KEY_LINK_CLICKED, { handle, userId }))
  }, [record, handle, userId])

  const appearanceOptions = useMemo(() => {
    const options = [
      {
        key: Theme.AUTO,
        text: messages.autoMode
      },
      {
        key: Theme.DEFAULT,
        text: messages.lightMode
      },
      {
        key: Theme.DARK,
        text: messages.darkMode
      }
    ]
    if (showMatrix) {
      options.push({ key: Theme.MATRIX, text: messages.matrixMode })
    }
    if (isStaging) {
      options.push({ key: Theme.DEBUG, text: messages.debugMode })
    }
    return options
  }, [showMatrix])

  const { isEnabled: isPayoutWalletEnabled } = useFlag(
    FeatureFlags.PAYOUT_WALLET_ENABLED
  )
  const allowAiAttribution = useSelector(getAllowAiAttribution)
  const { isEnabled: isAiAttributionEnabled } = useFlag(
    FeatureFlags.AI_ATTRIBUTION
  )
  const { isEnabled: isManagerModeEnabled } = useFlag(FeatureFlags.MANAGER_MODE)
  const { isEnabled: isCommentsEnabled } = useFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isMobile = useIsMobile()
  const isDownloadDesktopEnabled = !isMobile && !isElectron()

  const header = <Header primary={messages.pageTitle} />

  return (
    <Page
      title={title}
      description={description}
      containerClassName={styles.settingsPageContainer}
      contentClassName={styles.settingsPageContent}
      header={header}
    >
      <div className={styles.settings}>
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconAppearance />}
            title={messages.appearanceTitle}
            description={messages.appearanceDescription}
            isFull={true}
          >
            <SegmentedControl
              fullWidth
              label={messages.appearanceTitle}
              options={appearanceOptions}
              selected={theme || Theme.DEFAULT}
              onSelectOption={(option) => toggleTheme(option)}
              key={`tab-slider-${appearanceOptions.length}`}
            />
          </SettingsCard>
        ) : null}
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconMessages />}
            title={messages.inboxSettingsCardTitle}
            description={messages.inboxSettingsCardDescription}
          >
            <Button
              variant='secondary'
              onClick={openInboxSettingsModal}
              fullWidth
            >
              {messages.inboxSettingsButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {isCommentsEnabled ? (
          <SettingsCard
            icon={<IconMessage />}
            title={messages.commentSettingsCardTitle}
            description={messages.commentSettingsCardDescription}
          >
            <Button
              variant='secondary'
              onClick={openCommentSettingsModal}
              fullWidth
            >
              {messages.commentSettingsButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        <SettingsCard
          icon={<IconNotification />}
          title={messages.notificationsCardTitle}
          description={messages.notificationsCardDescription}
        >
          <Button
            variant='secondary'
            onClick={openNotificationSettings}
            fullWidth
          >
            {messages.notificationsButtonText}
          </Button>
        </SettingsCard>
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconMail />}
            title={messages.accountRecoveryCardTitle}
            description={messages.accountRecoveryCardDescription}
          >
            <Toast
              tooltipClassName={styles.cardToast}
              text={emailToastText}
              open={isEmailToastVisible}
              placement={ComponentPlacement.BOTTOM}
              fillParent={false}
            >
              <Button onClick={showEmailToast} variant='secondary' fullWidth>
                {messages.accountRecoveryButtonText}
              </Button>
            </Toast>
          </SettingsCard>
        ) : null}
        <SettingsCard
          icon={<IconVerified className={styles.iconVerified} size='l' />}
          title={messages.verificationCardTitle}
          description={messages.verificationCardDescription}
        >
          <VerificationModal
            userId={userId}
            handle={handle}
            name={name}
            profilePictureSizes={profilePictureSizes}
            goToRoute={goToRoute}
            isVerified={isVerified}
            onInstagramLogin={onInstagramLogin}
            onTwitterLogin={onTwitterLogin}
            onTikTokLogin={onTikTokLogin}
          />
        </SettingsCard>
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconEmailAddress />}
            title={messages.changeEmailCardTitle}
            description={messages.changeEmailCardDescription}
          >
            <Button
              onClick={openChangeEmailModal}
              variant='secondary'
              fullWidth
            >
              {messages.changeEmailButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconKey />}
            title={messages.changePasswordCardTitle}
            description={messages.changePasswordCardDescription}
          >
            <Button
              onClick={openChangePasswordModal}
              variant='secondary'
              fullWidth
            >
              {messages.changePasswordButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {isManagerModeEnabled ? (
          <>
            <AccountsManagingYouSettingsCard />
            <AccountsYouManageSettingsCard />
          </>
        ) : null}
        {isAiAttributionEnabled ? (
          <SettingsCard
            icon={<IconRobot />}
            title={messages.aiGeneratedCardTitle}
            description={messages.aiGeneratedCardDescription}
          >
            {allowAiAttribution ? (
              <span className={styles.aiAttributionEnabled}>
                {messages.aiGeneratedEnabled}
              </span>
            ) : null}
            <Button
              onClick={openAiAttributionSettingsModal}
              variant='secondary'
              fullWidth
            >
              {messages.aiGeneratedButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {isDownloadDesktopEnabled ? (
          <SettingsCard
            icon={<IconReceive />}
            title={messages.desktopAppCardTitle}
            description={messages.desktopAppCardDescription}
          >
            <Button
              onClick={handleDownloadDesktopAppClicked}
              variant='secondary'
              fullWidth
            >
              {messages.desktopAppButtonText}
            </Button>
          </SettingsCard>
        ) : null}

        <AuthorizedAppsSettingsCard />
        <DeveloperAppsSettingsCard />
        {isPayoutWalletEnabled ? <PayoutWalletSettingsCard /> : null}
      </div>
      <div className={styles.version}>
        <Button
          variant='secondary'
          iconLeft={IconSignOut}
          onClick={openSignOutModal}
          css={(theme) => ({ marginBottom: theme.spacing.l })}
        >
          {messages.signOut}
        </Button>
        <span>{`${messages.version} ${version}`}</span>
        <span>
          {messages.copyright} -{' '}
          <Link
            className={styles.link}
            to={TERMS_OF_SERVICE}
            target='_blank'
            rel='noreferrer'
          >
            {messages.terms}
          </Link>{' '}
          -{' '}
          <Link
            className={styles.link}
            to={PRIVACY_POLICY}
            target='_blank'
            rel='noreferrer'
          >
            {messages.privacy}
          </Link>
        </span>
        {!isManagedAccount ? (
          <Link
            className={cn(styles.link, styles.showPrivateKey)}
            to={PRIVATE_KEY_EXPORTER_SETTINGS_PAGE}
            onClick={recordExportPrivateKeyLinkClicked}
          >
            {messages.showPrivateKey}
          </Link>
        ) : null}
      </div>
      <Modal
        isOpen={isSignOutModalVisible}
        onClose={closeSignOutModal}
        size='small'
      >
        <ModalHeader>
          <ModalTitle
            title={
              <>
                Hold Up! <i className='emoji waving-hand-sign' />
              </>
            }
          />
        </ModalHeader>
        <ModalContent>
          <ModalContentText>{messages.signOutModalText}</ModalContentText>
          <ModalFooter>
            <Button variant='secondary' onClick={closeSignOutModal} fullWidth>
              Nevermind
            </Button>
            <Button variant='primary' onClick={handleSignOut} fullWidth>
              Sign Out
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ChangePasswordModal
        isOpen={isChangePasswordModalVisible}
        onClose={closeChangePasswordModal}
      />
      <ChangeEmailModal
        isOpen={isChangeEmailModalVisible}
        onClose={closeChangeEmailModal}
      />
      <NotificationSettings
        isOpen={isNotificationSettingsModalVisible}
        toggleBrowserPushNotificationPermissions={
          toggleBrowserPushNotificationPermissions
        }
        toggleNotificationSetting={toggleNotificationSetting}
        updateEmailFrequency={updateEmailFrequency}
        settings={notificationSettings}
        emailFrequency={emailFrequency}
        onClose={closeNotificationSettings}
      />
    </Page>
  )
}
