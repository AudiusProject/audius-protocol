import { ComponentType, useCallback } from 'react'

import { Name, Theme } from '@audius/common/models'
import {
  accountActions,
  accountSelectors,
  settingsPageSelectors,
  BrowserNotificationSetting,
  PushNotificationSetting,
  EmailFrequency,
  signOutActions,
  getTierAndVerifiedForUser,
  themeActions,
  themeSelectors,
  modalsActions,
  musicConfettiActions,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile,
  settingsPageActions
} from '@audius/common/store'
import { push as pushRoute, goBack } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
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
import { THEME_KEY } from 'utils/theme/theme'
import { withNullGuard } from 'utils/withNullGuard'

import { SettingsPageProps as DesktopSettingsPageProps } from './components/desktop/SettingsPage'
import {
  SettingsPageProps as MobileSettingsPageProps,
  SubPage
} from './components/mobile/SettingsPage'
const { show } = musicConfettiActions

const { signOut } = signOutActions
const { setTheme } = themeActions
const { getTheme } = themeSelectors
const {
  getBrowserNotificationSettings,
  getPushNotificationSettings,
  getEmailFrequency
} = settingsPageSelectors
const {
  setBrowserNotificationEnabled,
  setBrowserNotificationSettingsOff,
  setBrowserNotificationSettingsOn,
  setBrowserNotificationPermission,
  toggleNotificationSetting,
  togglePushNotificationSetting,
  getNotificationSettings,
  getPushNotificationSettings: getPushNotificationSettingsAction,
  updateEmailFrequency
} = settingsPageActions
const { subscribeBrowserPushNotifications } = accountActions

const {
  getAccountVerified,
  getAccountHasTracks,
  getAccountProfilePictureSizes,
  getUserId,
  getUserHandle,
  getUserName
} = accountSelectors

const isStaging = env.ENVIRONMENT === 'staging'

const messages = {
  title: 'Settings',
  description: 'Configure your Audius account'
}

type OwnProps = {
  children:
    | ComponentType<MobileSettingsPageProps>
    | ComponentType<DesktopSettingsPageProps>
  subPage?: SubPage
}

const g = withNullGuard((props: OwnProps) => {
  const { children } = props
  if (children) return { ...props, children }
})

const SettingsPage = g(({ children: Children, subPage }: OwnProps) => {
  const dispatch = useDispatch()

  const userId = useSelector(getUserId) ?? 0
  const handle = useSelector(getUserHandle)
  const name = useSelector(getUserName)
  const isVerified = useSelector(getAccountVerified)
  const hasTracks = useSelector(getAccountHasTracks)
  const profilePictureSizes = useSelector(getAccountProfilePictureSizes)
  const theme = useSelector(getTheme)
  const emailFrequency = useSelector(getEmailFrequency)
  const notificationSettings = useSelector(getBrowserNotificationSettings)
  const pushNotificationSettings = useSelector(getPushNotificationSettings)
  const tier = useSelector(
    (state: AppState) => getTierAndVerifiedForUser(state, { userId }).tier
  )
  console.log('REED render')

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

  const toggleBrowserPushNotificationPermissions = useCallback(
    (notificationType: BrowserNotificationSetting, isOn: boolean) => {
      if (!isOn) {
        dispatch(setBrowserNotificationEnabled(false))
        dispatch(setBrowserNotificationSettingsOff())
      } else if (notificationSettings.permission === Permission.GRANTED) {
        dispatch(setBrowserNotificationEnabled(true))
        dispatch(setBrowserNotificationSettingsOn())
        dispatch(toggleNotificationSetting(notificationType, isOn))
        dispatch(subscribeBrowserPushNotifications())
      } else {
        if (isPushManagerAvailable) {
          dispatch(setBrowserNotificationEnabled(true))
          dispatch(subscribeBrowserPushNotifications())
          dispatch(toggleNotificationSetting(notificationType, isOn))
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

  const showMatrix = tier === 'gold' || tier === 'platinum' || isStaging

  const childProps = {
    title: messages.title,
    description: messages.description,
    isVerified,
    hasTracks,
    userId,
    handle,
    name,
    profilePictureSizes,
    theme,
    toggleTheme,
    notificationSettings,
    emailFrequency,
    pushNotificationSettings,
    toggleBrowserPushNotificationPermissions,
    showMatrix,
    onTwitterLogin: useCallback(
      (uuid: string, profile: TwitterProfile) =>
        dispatch(accountActions.twitterLogin({ uuid, profile })),
      [dispatch]
    ),
    onInstagramLogin: useCallback(
      (uuid: string, profile: InstagramProfile) =>
        dispatch(accountActions.instagramLogin({ uuid, profile })),
      [dispatch]
    ),
    onTikTokLogin: useCallback(
      (uuid: string, profile: TikTokProfile) =>
        dispatch(accountActions.tikTokLogin({ uuid, profile })),
      [dispatch]
    ),
    getNotificationSettings: useCallback(
      () => dispatch(getNotificationSettings()),
      [dispatch]
    ),
    getPushNotificationSettings: useCallback(
      () => dispatch(getPushNotificationSettingsAction()),
      [dispatch]
    ),
    toggleNotificationSetting: useCallback(
      (notificationType: BrowserNotificationSetting, isOn: boolean) =>
        dispatch(toggleNotificationSetting(notificationType, isOn)),
      [dispatch]
    ),
    togglePushNotificationSetting: useCallback(
      (notificationType: PushNotificationSetting, isOn: boolean) =>
        dispatch(togglePushNotificationSetting(notificationType, isOn)),
      [dispatch]
    ),
    updateEmailFrequency: useCallback(
      (frequency: EmailFrequency) => dispatch(updateEmailFrequency(frequency)),
      [dispatch]
    ),
    goToRoute: useCallback(
      (route: string) => dispatch(pushRoute(route)),
      [dispatch]
    ),
    goBack: useCallback(() => dispatch(goBack()), [dispatch]),
    recordSignOut: useCallback(
      (callback?: () => void) =>
        dispatch(make(Name.SETTINGS_LOG_OUT, { callback })),
      [dispatch]
    ),
    recordAccountRecovery: useCallback(
      () => dispatch(make(Name.SETTINGS_RESEND_ACCOUNT_RECOVERY, {})),
      [dispatch]
    ),
    recordDownloadDesktopApp: () =>
      dispatch(
        make(Name.ACCOUNT_HEALTH_DOWNLOAD_DESKTOP, { source: 'settings' })
      ),
    signOut: useCallback(() => dispatch(signOut()), [dispatch])
  }

  const mobileProps = { subPage }

  if (!handle || !name || !userId) {
    return null
  }

  return <Children {...childProps} {...mobileProps} />
})

export default SettingsPage
