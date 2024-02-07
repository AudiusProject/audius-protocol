import { useCallback, useEffect, useMemo, useState } from 'react'

import { OS, Theme, ID, ProfilePictureSizes, Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  settingsPageSelectors,
  BrowserNotificationSetting,
  EmailFrequency,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile,
  Notifications
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import {
  IconAppearance,
  SegmentedControl,
  IconDesktop,
  IconRobot,
  IconRecoveryEmail as IconMail,
  IconNotificationOn as IconNotification,
  IconSignOut,
  IconVerified,
  IconSettings,
  IconMessage
} from '@audius/harmony'
import { Modal, Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { Link } from 'react-router-dom'

import { useModalState } from 'common/hooks/useModalState'
import { make, useRecord } from 'common/store/analytics/actions'
import { ChangePasswordModal } from 'components/change-password/ChangePasswordModal'
import ConfirmationBox from 'components/confirmation-box/ConfirmationBox'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import Toast from 'components/toast/Toast'
import { ComponentPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useFlag } from 'hooks/useRemoteConfig'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import DownloadApp from 'services/download-app/DownloadApp'
import { isElectron, getOS } from 'utils/clientUtil'
import { COPYRIGHT_TEXT } from 'utils/copyright'
import { useSelector } from 'utils/reducer'
import {
  PRIVACY_POLICY,
  PRIVATE_KEY_EXPORTER_SETTINGS_PAGE,
  TERMS_OF_SERVICE
} from 'utils/route'

import packageInfo from '../../../../../package.json'

import { DeveloperAppsSettingsCard } from './DeveloperApps'
import NotificationSettings from './NotificationSettings'
import SettingsCard from './SettingsCard'
import styles from './SettingsPage.module.css'
import VerificationModal from './VerificationModal'

const { getAllowAiAttribution } = settingsPageSelectors
const { version } = packageInfo

const SIGN_OUT_MODAL_TEXT = `
  Are you sure you want to sign out?
  Double check that you have an account recovery email just in case (resend from your settings).
`

const EMAIL_TOAST_TIMEOUT = 2000

const messages = {
  pageTitle: 'Settings',
  version: 'Audius Version',
  copyright: COPYRIGHT_TEXT,
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  emailSent: 'Email Sent!',
  emailNotSent: 'Something broke! Please try again!',
  darkModeOn: 'Dark',
  darkModeOff: 'Light',
  darkModeAuto: 'Auto',
  matrixMode: '🕳 🐇 Matrix',
  changePassword: 'Change Password',
  signOut: 'Sign Out',

  aiGeneratedCardTitle: 'AI Generated music',
  appearanceCardTitle: 'Appearance',
  inboxSettingsCardTitle: 'Inbox Settings',
  notificationsCardTitle: 'Configure Notifications',
  accountRecoveryCardTitle: 'Resend Recovery Email',
  changePasswordCardTitle: 'Change Password',
  verificationCardTitle: 'Verification',
  desktopAppCardTitle: 'Download the Desktop App',

  aiGeneratedCardDescription:
    'Opt in to allow AI models to be trained on your likeness, and to let users credit you in their AI generated works.',
  appearanceCardDescription:
    'Enable dark mode or choose ‘Auto’ to change with your system settings.',
  inboxSettingsCardDescription:
    'Configure who is able to send messages to your inbox.',
  notificationsCardDescription: 'Review your notification preferences.',
  accountRecoveryCardDescription:
    'Resend your password reset email and store it safely. This email is the only way to recover your account if you forget your password.',
  changePasswordCardDescription: 'Change the password to your Audius account.',
  verificationCardDescription:
    'Verify your Audius profile by linking a verified account from Twitter, Instagram, or TikTok.',
  desktopAppCardDescription:
    'For the best experience, we reccomend downloading the Audius Desktop App.',

  aiGeneratedEnabled: 'Enabled',
  aiGeneratedButtonText: 'AI Generated Music Settings',
  inboxSettingsButtonText: 'Inbox Settings',
  notificationsButtonText: 'Configure Notifications',
  accountRecoveryButtonText: 'Resend Email',
  changePasswordButtonText: 'Change Password',
  desktopAppButtonText: 'Get The App',
  showPrivateKey: 'Show Private Key (Advanced)'
}

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

  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false)
  const [
    isNotificationSettingsModalVisible,
    setIsNotificationSettingsModalVisible
  ] = useState(false)
  const [isEmailToastVisible, setIsEmailToastVisible] = useState(false)
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false)
  const [emailToastText, setEmailToastText] = useState(messages.emailSent)
  const [, setIsInboxSettingsModalVisible] = useModalState('InboxSettings')
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
        await audiusBackendInstance.sendRecoveryEmail()
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
  }, [setIsEmailToastVisible, recordAccountRecovery, setEmailToastText])

  const handleDownloadDesktopAppClicked = useCallback(() => {
    DownloadApp.start(getOS() || OS.WIN)
    recordDownloadDesktopApp()
  }, [recordDownloadDesktopApp])

  const openChangePasswordModal = useCallback(() => {
    setIsChangePasswordModalVisible(true)
  }, [setIsChangePasswordModalVisible])

  const closeChangePasswordModal = useCallback(() => {
    setIsChangePasswordModalVisible(false)
  }, [setIsChangePasswordModalVisible])

  const openInboxSettingsModal = useCallback(() => {
    setIsInboxSettingsModalVisible(true)
  }, [setIsInboxSettingsModalVisible])

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
        text: messages.darkModeAuto
      },
      {
        key: Theme.DEFAULT,
        text: messages.darkModeOff
      },
      {
        key: Theme.DARK,
        text: messages.darkModeOn
      }
    ]
    if (showMatrix) {
      options.push({ key: Theme.MATRIX, text: messages.matrixMode })
    }
    return options
  }, [showMatrix])

  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)
  const allowAiAttribution = useSelector(getAllowAiAttribution)
  const { isEnabled: isAiAttributionEnabled } = useFlag(
    FeatureFlags.AI_ATTRIBUTION
  )
  const { isEnabled: areDeveloperAppsEnabled } = useFlag(
    FeatureFlags.DEVELOPER_APPS_PAGE
  )

  const isMobile = useIsMobile()
  const isDownloadDesktopEnabled = !isMobile && !isElectron()

  const hasOddCardCount = Boolean(
    [isChatEnabled, isAiAttributionEnabled, areDeveloperAppsEnabled].filter(
      removeNullable
    ).length % 2
  )

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
        <SettingsCard
          className={cn({ [styles.cardFull]: hasOddCardCount })}
          icon={<IconAppearance />}
          title={messages.appearanceCardTitle}
          description={messages.appearanceCardDescription}
        >
          <SegmentedControl
            fullWidth
            label={messages.appearanceCardTitle}
            options={appearanceOptions}
            selected={theme || Theme.DEFAULT}
            onSelectOption={(option) => toggleTheme(option)}
            key={`tab-slider-${appearanceOptions.length}`}
          />
        </SettingsCard>
        {isChatEnabled ? (
          <SettingsCard
            icon={<IconMessage />}
            title={messages.inboxSettingsCardTitle}
            description={messages.inboxSettingsCardDescription}
          >
            <Button
              onClick={openInboxSettingsModal}
              className={styles.cardButton}
              textClassName={styles.settingButtonText}
              type={ButtonType.COMMON_ALT}
              text={messages.inboxSettingsButtonText}
            />
          </SettingsCard>
        ) : null}
        <SettingsCard
          icon={<IconNotification />}
          title={messages.notificationsCardTitle}
          description={messages.notificationsCardDescription}
        >
          <Button
            onClick={openNotificationSettings}
            className={styles.cardButton}
            textClassName={styles.settingButtonText}
            type={ButtonType.COMMON_ALT}
            text={messages.notificationsButtonText}
          />
        </SettingsCard>
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
            <Button
              onClick={showEmailToast}
              className={styles.cardButton}
              textClassName={styles.settingButtonText}
              type={ButtonType.COMMON_ALT}
              text={messages.accountRecoveryButtonText}
            />
          </Toast>
        </SettingsCard>
        <SettingsCard
          icon={<IconSettings />}
          title={messages.changePassword}
          description={messages.changePasswordCardDescription}
        >
          <Button
            onClick={openChangePasswordModal}
            className={cn(styles.cardButton, styles.changePasswordButton)}
            textClassName={styles.settingButtonText}
            type={ButtonType.COMMON_ALT}
            text={messages.changePasswordButtonText}
          />
        </SettingsCard>
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
              className={styles.cardButton}
              textClassName={styles.settingButtonText}
              type={ButtonType.COMMON_ALT}
              text={messages.aiGeneratedButtonText}
            />
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
        {isDownloadDesktopEnabled ? (
          <SettingsCard
            icon={<IconDesktop />}
            title={messages.desktopAppCardTitle}
            description={messages.desktopAppCardDescription}
          >
            <Button
              onClick={handleDownloadDesktopAppClicked}
              className={styles.cardButton}
              textClassName={styles.settingButtonText}
              type={ButtonType.COMMON_ALT}
              text={messages.desktopAppButtonText}
            />
          </SettingsCard>
        ) : null}
        {areDeveloperAppsEnabled ? <DeveloperAppsSettingsCard /> : null}
      </div>
      <div className={styles.version}>
        <Button
          className={styles.signOutButton}
          textClassName={styles.signOutButtonText}
          iconClassName={styles.signOutButtonIcon}
          type={ButtonType.COMMON_ALT}
          text={messages.signOut}
          name='sign-out'
          leftIcon={<IconSignOut />}
          onClick={openSignOutModal}
        />
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
        <Link
          className={cn(styles.link, styles.showPrivateKey)}
          to={PRIVATE_KEY_EXPORTER_SETTINGS_PAGE}
          onClick={recordExportPrivateKeyLinkClicked}
        >
          {messages.showPrivateKey}
        </Link>
      </div>
      <Modal
        title={
          <>
            Hold Up! <i className='emoji waving-hand-sign' />
          </>
        }
        isOpen={isSignOutModalVisible}
        onClose={closeSignOutModal}
        showTitleHeader
        showDismissButton
        bodyClassName={styles.modalBody}
        headerContainerClassName={styles.modalHeader}
        titleClassName={styles.modalTitle}
      >
        <ConfirmationBox
          text={SIGN_OUT_MODAL_TEXT}
          rightText='NEVERMIND'
          leftText='SIGN OUT'
          leftName='confirm-sign-out'
          rightClick={closeSignOutModal}
          leftClick={handleSignOut}
        />
      </Modal>
      <ChangePasswordModal
        showModal={isChangePasswordModalVisible}
        onClose={closeChangePasswordModal}
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
