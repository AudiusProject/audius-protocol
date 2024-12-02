import { useCallback, useEffect, useMemo, useState } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'
import { settingsMessages } from '@audius/common/messages'
import { Name, Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  BrowserNotificationSetting,
  EmailFrequency,
  InstagramProfile,
  TikTokProfile,
  TwitterProfile,
  accountActions,
  settingsPageActions,
  settingsPageSelectors,
  themeSelectors,
  themeActions,
  signOutActions,
  accountSelectors,
  getTierAndVerifiedForUser,
  musicConfettiActions
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
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'
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
import { AppState } from 'store/types'
import {
  isPushManagerAvailable,
  isSafariPushAvailable,
  getSafariPushBrowser,
  subscribeSafariPushBrowser,
  Permission
} from 'utils/browserNotifications'
import { isElectron } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'
import { THEME_KEY } from 'utils/theme/theme'

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

const { show } = musicConfettiActions
const { signOut: signOutAction } = signOutActions
const { setTheme } = themeActions
const { getTheme } = themeSelectors
const { getBrowserNotificationSettings, getEmailFrequency } =
  settingsPageSelectors
const {
  setBrowserNotificationEnabled,
  setBrowserNotificationSettingsOff,
  setBrowserNotificationSettingsOn,
  setBrowserNotificationPermission,
  toggleNotificationSetting: toggleNotificationSettingAction,
  getNotificationSettings,
  updateEmailFrequency: updateEmailFrequencyAction
} = settingsPageActions
const {
  getAccountVerified,
  getAccountProfilePictureSizes,
  getUserId,
  getUserHandle,
  getUserName
} = accountSelectors
const { subscribeBrowserPushNotifications } = accountActions

const {
  DOWNLOAD_LINK,
  PRIVACY_POLICY,
  PRIVATE_KEY_EXPORTER_SETTINGS_PAGE,
  TERMS_OF_SERVICE
} = route
const { getAllowAiAttribution } = settingsPageSelectors
const { version } = packageInfo

const isStaging = env.ENVIRONMENT === 'staging'

const EMAIL_TOAST_TIMEOUT = 2000

const messages = {
  title: 'Settings',
  description: 'Configure your Audius account'
}

export const SettingsPage = () => {
  const dispatch = useDispatch()
  const isManagedAccount = useIsManagedAccount()

  const userId = useSelector(getUserId) ?? 0
  const handle = useSelector(getUserHandle) ?? ''
  const name = useSelector(getUserName) ?? ''
  const isVerified = useSelector(getAccountVerified)
  const profilePictureSizes = useSelector(getAccountProfilePictureSizes)
  const theme = useSelector(getTheme)
  const emailFrequency = useSelector(getEmailFrequency)
  const notificationSettings = useSelector(getBrowserNotificationSettings)
  const tier = useSelector(
    (state: AppState) => getTierAndVerifiedForUser(state, { userId }).tier
  )
  const showMatrix = tier === 'gold' || tier === 'platinum' || isStaging

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
  const [emailToastText, setEmailToastText] = useState(
    settingsMessages.emailSent
  )
  const [, setIsInboxSettingsModalVisible] = useModalState('InboxSettings')
  const [, setIsCommentSettingsModalVisible] = useModalState('CommentSettings')
  const [, setIsAIAttributionSettingsModalVisible] = useModalState(
    'AiAttributionSettings'
  )

  useEffect(() => {
    dispatch(getNotificationSettings())
  }, [dispatch])

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

  const signOut = useCallback(() => {
    dispatch(signOutAction())
  }, [dispatch])

  const handleSignOut = useCallback(() => {
    dispatch(make(Name.SETTINGS_LOG_OUT, { callback: signOut }))
  }, [dispatch, signOut])

  const showEmailToast = useCallback(() => {
    const fn = async () => {
      try {
        await audiusBackendInstance.sendRecoveryEmail(handle)
        setEmailToastText(settingsMessages.emailSent)
        setIsEmailToastVisible(true)
        dispatch(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {}))
      } catch (e) {
        console.error(e)
        setEmailToastText(settingsMessages.emailNotSent)
        setIsEmailToastVisible(true)
      }
      setTimeout(() => {
        setIsEmailToastVisible(false)
      }, EMAIL_TOAST_TIMEOUT)
    }
    fn()
  }, [handle, setIsEmailToastVisible, setEmailToastText, dispatch])

  const handleDownloadDesktopAppClicked = useCallback(() => {
    dispatch(make(Name.ACCOUNT_HEALTH_DOWNLOAD_DESKTOP, { source: 'settings' }))
    window.location.href = `https://audius.co${DOWNLOAD_LINK}`
  }, [dispatch])

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

  const onTwitterLogin = useCallback(
    (uuid: string, profile: TwitterProfile) =>
      dispatch(accountActions.twitterLogin({ uuid, profile })),
    [dispatch]
  )
  const onInstagramLogin = useCallback(
    (uuid: string, profile: InstagramProfile) =>
      dispatch(accountActions.instagramLogin({ uuid, profile })),
    [dispatch]
  )
  const onTikTokLogin = useCallback(
    (uuid: string, profile: TikTokProfile) =>
      dispatch(accountActions.tikTokLogin({ uuid, profile })),
    [dispatch]
  )
  const toggleNotificationSetting = useCallback(
    (notificationType: BrowserNotificationSetting, isOn: boolean) => {
      dispatch(toggleNotificationSettingAction(notificationType, isOn))
    },
    [dispatch]
  )
  const updateEmailFrequency = useCallback(
    (frequency: EmailFrequency) => {
      dispatch(updateEmailFrequencyAction(frequency))
    },
    [dispatch]
  )
  const goToRoute = useCallback(
    (route: string) => dispatch(pushRoute(route)),
    [dispatch]
  )
  const record = useRecord()
  const recordExportPrivateKeyLinkClicked = useCallback(() => {
    record(make(Name.EXPORT_PRIVATE_KEY_LINK_CLICKED, { handle, userId }))
  }, [record, handle, userId])

  const toggleBrowserPushNotificationPermissions = useCallback(
    (notificationType: BrowserNotificationSetting, isOn: boolean) => {
      if (!isOn) {
        dispatch(setBrowserNotificationEnabled(false))
        dispatch(setBrowserNotificationSettingsOff())
      } else if (notificationSettings.permission === Permission.GRANTED) {
        dispatch(setBrowserNotificationEnabled(true))
        dispatch(setBrowserNotificationSettingsOn())
        dispatch(toggleNotificationSettingAction(notificationType, isOn))
        dispatch(subscribeBrowserPushNotifications())
      } else {
        if (isPushManagerAvailable) {
          dispatch(setBrowserNotificationEnabled(true))
          dispatch(subscribeBrowserPushNotifications())
          dispatch(toggleNotificationSettingAction(notificationType, isOn))
        } else if (isSafariPushAvailable) {
          const safariPermission = getSafariPushBrowser()
          if (safariPermission.permission === Permission.GRANTED) {
            dispatch(subscribeBrowserPushNotifications())
          } else {
            const getSafariPermission = async () => {
              const permissionData = await subscribeSafariPushBrowser(
                audiusBackendInstance
              )
              if (
                permissionData &&
                permissionData.permission === Permission.GRANTED
              ) {
                dispatch(subscribeBrowserPushNotifications())
              } else if (
                permissionData &&
                permissionData.permission === Permission.DENIED
              ) {
                dispatch(setBrowserNotificationPermission(Permission.DENIED))
              }
            }
            getSafariPermission()
          }
        }
      }
    },
    [dispatch, notificationSettings.permission]
  )

  const toggleTheme = (option: Theme) => {
    dispatch(
      make(Name.SETTINGS_CHANGE_THEME, {
        mode:
          option === Theme.DEFAULT
            ? 'light'
            : (option.toLowerCase() as 'dark' | 'light' | 'matrix' | 'auto')
      })
    )
    dispatch(setTheme({ theme: option }))
    if (option === Theme.MATRIX) {
      dispatch(show())
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, option)
    }
  }

  const appearanceOptions = useMemo(() => {
    const options = [
      {
        key: Theme.AUTO,
        text: settingsMessages.autoMode
      },
      {
        key: Theme.DEFAULT,
        text: settingsMessages.lightMode
      },
      {
        key: Theme.DARK,
        text: settingsMessages.darkMode
      }
    ]
    if (showMatrix) {
      options.push({ key: Theme.MATRIX, text: settingsMessages.matrixMode })
    }
    return options
  }, [showMatrix])

  const allowAiAttribution = useSelector(getAllowAiAttribution)
  const { isEnabled: isCommentsEnabled } = useFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isMobile = useIsMobile()
  const isDownloadDesktopEnabled = !isMobile && !isElectron()

  const header = <Header primary={messages.title} />

  return (
    <Page
      title={messages.title}
      description={messages.description}
      containerClassName={styles.settingsPageContainer}
      contentClassName={styles.settingsPageContent}
      header={header}
    >
      <div className={styles.settings}>
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconAppearance />}
            title={settingsMessages.appearanceTitle}
            description={settingsMessages.appearanceDescription}
            isFull={true}
          >
            <SegmentedControl
              fullWidth
              label={settingsMessages.appearanceTitle}
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
            title={settingsMessages.inboxSettingsCardTitle}
            description={settingsMessages.inboxSettingsCardDescription}
          >
            <Button
              variant='secondary'
              onClick={openInboxSettingsModal}
              fullWidth
            >
              {settingsMessages.inboxSettingsButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {isCommentsEnabled ? (
          <SettingsCard
            icon={<IconMessage />}
            title={settingsMessages.commentSettingsCardTitle}
            description={settingsMessages.commentSettingsCardDescription}
          >
            <Button
              variant='secondary'
              onClick={openCommentSettingsModal}
              fullWidth
            >
              {settingsMessages.commentSettingsButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        <SettingsCard
          icon={<IconNotification />}
          title={settingsMessages.notificationsCardTitle}
          description={settingsMessages.notificationsCardDescription}
        >
          <Button
            variant='secondary'
            onClick={openNotificationSettings}
            fullWidth
          >
            {settingsMessages.notificationsButtonText}
          </Button>
        </SettingsCard>
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconMail />}
            title={settingsMessages.accountRecoveryCardTitle}
            description={settingsMessages.accountRecoveryCardDescription}
          >
            <Toast
              tooltipClassName={styles.cardToast}
              text={emailToastText}
              open={isEmailToastVisible}
              placement={ComponentPlacement.BOTTOM}
              fillParent={false}
            >
              <Button onClick={showEmailToast} variant='secondary' fullWidth>
                {settingsMessages.accountRecoveryButtonText}
              </Button>
            </Toast>
          </SettingsCard>
        ) : null}
        <SettingsCard
          icon={<IconVerified className={styles.iconVerified} size='l' />}
          title={settingsMessages.verificationCardTitle}
          description={settingsMessages.verificationCardDescription}
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
            title={settingsMessages.changeEmailCardTitle}
            description={settingsMessages.changeEmailCardDescription}
          >
            <Button
              onClick={openChangeEmailModal}
              variant='secondary'
              fullWidth
            >
              {settingsMessages.changeEmailButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        {!isManagedAccount ? (
          <SettingsCard
            icon={<IconKey />}
            title={settingsMessages.changePasswordCardTitle}
            description={settingsMessages.changePasswordCardDescription}
          >
            <Button
              onClick={openChangePasswordModal}
              variant='secondary'
              fullWidth
            >
              {settingsMessages.changePasswordButtonText}
            </Button>
          </SettingsCard>
        ) : null}
        <AccountsManagingYouSettingsCard />
        <AccountsYouManageSettingsCard />
        <SettingsCard
          icon={<IconRobot />}
          title={settingsMessages.aiGeneratedCardTitle}
          description={settingsMessages.aiGeneratedCardDescription}
        >
          {allowAiAttribution ? (
            <span className={styles.aiAttributionEnabled}>
              {settingsMessages.aiGeneratedEnabled}
            </span>
          ) : null}
          <Button
            onClick={openAiAttributionSettingsModal}
            variant='secondary'
            fullWidth
          >
            {settingsMessages.aiGeneratedButtonText}
          </Button>
        </SettingsCard>
        {isDownloadDesktopEnabled ? (
          <SettingsCard
            icon={<IconReceive />}
            title={settingsMessages.desktopAppCardTitle}
            description={settingsMessages.desktopAppCardDescription}
          >
            <Button
              onClick={handleDownloadDesktopAppClicked}
              variant='secondary'
              fullWidth
            >
              {settingsMessages.desktopAppButtonText}
            </Button>
          </SettingsCard>
        ) : null}

        <AuthorizedAppsSettingsCard />
        <DeveloperAppsSettingsCard />
        <PayoutWalletSettingsCard />
      </div>
      <div className={styles.version}>
        <Button
          variant='secondary'
          iconLeft={IconSignOut}
          onClick={openSignOutModal}
          css={(theme) => ({ marginBottom: theme.spacing.l })}
        >
          {settingsMessages.signOut}
        </Button>
        <span>{`${settingsMessages.version} ${version}`}</span>
        <span>
          {settingsMessages.copyright} -{' '}
          <Link
            className={styles.link}
            to={TERMS_OF_SERVICE}
            target='_blank'
            rel='noreferrer'
          >
            {settingsMessages.terms}
          </Link>{' '}
          -{' '}
          <Link
            className={styles.link}
            to={PRIVACY_POLICY}
            target='_blank'
            rel='noreferrer'
          >
            {settingsMessages.privacy}
          </Link>
        </span>
        {!isManagedAccount ? (
          <Link
            className={cn(styles.link, styles.showPrivateKey)}
            to={PRIVATE_KEY_EXPORTER_SETTINGS_PAGE}
            onClick={recordExportPrivateKeyLinkClicked}
          >
            {settingsMessages.showPrivateKey}
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
          <ModalContentText>
            {settingsMessages.signOutModalText}
          </ModalContentText>
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
