import { ComponentType, PureComponent } from 'react'

import {
  Name,
  Theme,
  accountSelectors,
  InstagramProfile,
  settingsPageSelectors,
  BrowserNotificationSetting,
  EmailFrequency,
  PushNotificationSetting,
  settingsPageActions as settingPageActions,
  makeGetTierAndVerifiedForUser,
  modalsActions,
  themeSelectors,
  themeActions,
  accountActions,
  TwitterProfile,
  signOutActions,
  musicConfettiActions,
  TikTokProfile
} from '@audius/common'
import { push as pushRoute, goBack } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { make, TrackEvent } from 'common/store/analytics/actions'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { AppState } from 'store/types'
import {
  isPushManagerAvailable,
  isSafariPushAvailable,
  getSafariPushBrowser,
  subscribeSafariPushBrowser,
  Permission
} from 'utils/browserNotifications'
import { withClassNullGuard } from 'utils/withNullGuard'

import { SettingsPageProps as DesktopSettingsPageProps } from './components/desktop/SettingsPage'
import {
  SettingsPageProps as MobileSettingsPageProps,
  SubPage
} from './components/mobile/SettingsPage'
const { show } = musicConfettiActions

const { signOut } = signOutActions
const { setTheme } = themeActions
const { getTheme } = themeSelectors
const { setVisibility } = modalsActions
const {
  getBrowserNotificationSettings,
  getPushNotificationSettings,
  getEmailFrequency
} = settingsPageSelectors

const {
  getAccountVerified,
  getAccountHasTracks,
  getAccountProfilePictureSizes,
  getUserId,
  getUserHandle,
  getUserName
} = accountSelectors

const isStaging = true || process.env.VITE_ENVIRONMENT === 'staging'

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

type SettingsPageProps = OwnProps &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  ReturnType<typeof mapDispatchToProps>

type SettingsPageState = {
  darkModeSetting: boolean | null
}

const mapper = (props: SettingsPageProps) => {
  const { name, handle, userId } = props
  if (handle && name && userId !== null)
    return { ...props, name, handle, userId }
}

class SettingsPage extends PureComponent<
  NonNullable<ReturnType<typeof mapper>>,
  SettingsPageState
> {
  state = {
    darkModeSetting: null
  }

  toggleTheme = (option: Theme) => {
    this.props.recordThemeChange(option)
    this.props.setTheme(option)
    if (option === Theme.MATRIX) {
      this.props.showMatrixConfetti()
    }
  }

  toggleBrowserPushNotificationPermissions = (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => {
    if (!isOn) {
      // if turning off, set all settings values to false
      this.props.setBrowserNotificationEnabled(false)
      this.props.setBrowserNotificationSettingsOff()
    } else if (
      this.props.notificationSettings.permission === Permission.GRANTED
    ) {
      // Permission is already granted, don't need to popup confirmation modal.
      this.props.setBrowserNotificationEnabled(true)
      this.props.setBrowserNotificationSettingsOn()
      this.props.toggleNotificationSetting(notificationType, isOn)
      this.props.subscribeBrowserPushNotifications()
    } else {
      if (isPushManagerAvailable) {
        this.props.setBrowserNotificationEnabled(true)
        this.props.subscribeBrowserPushNotifications()
        this.props.toggleNotificationSetting(notificationType, isOn)
      } else if (isSafariPushAvailable) {
        // NOTE: The call call request browser permission must be done directly
        // b/c safari requires the user action to trigger the premission request
        const safariPermission = getSafariPushBrowser()
        if (safariPermission.permission === Permission.GRANTED) {
          this.props.subscribeBrowserPushNotifications()
        } else {
          const getSafariPermission = async () => {
            const permissionData = await subscribeSafariPushBrowser(
              audiusBackendInstance
            )
            if (
              permissionData &&
              permissionData.permission === Permission.GRANTED
            ) {
              this.props.subscribeBrowserPushNotifications()
            } else if (
              permissionData &&
              permissionData.permission === Permission.DENIED
            ) {
              this.props.setBrowserNotificationPermission(Permission.DENIED)
            }
          }
          getSafariPermission()
        }
      }
    }
  }

  render() {
    const {
      subPage,
      isVerified,
      hasTracks,
      userId,
      handle,
      name,
      profilePictureSizes,
      theme,
      notificationSettings,
      emailFrequency,
      pushNotificationSettings,
      getNotificationSettings,
      getPushNotificationSettings,
      onTwitterLogin,
      onInstagramLogin,
      onTikTokLogin,
      toggleNotificationSetting,
      togglePushNotificationSetting,
      updateEmailFrequency,
      goToRoute,
      goBack,
      recordSignOut,
      recordAccountRecovery,
      recordDownloadDesktopApp,
      tier,
      signOut
    } = this.props

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
      toggleTheme: this.toggleTheme,
      onInstagramLogin,
      recordSignOut,
      recordAccountRecovery,
      notificationSettings,
      emailFrequency,
      pushNotificationSettings,
      getNotificationSettings,
      getPushNotificationSettings,
      onTwitterLogin,
      onTikTokLogin,
      toggleNotificationSetting,
      toggleBrowserPushNotificationPermissions:
        this.toggleBrowserPushNotificationPermissions,
      togglePushNotificationSetting,
      updateEmailFrequency,
      recordDownloadDesktopApp,
      goToRoute,
      goBack,
      showMatrix,
      signOut
    }

    const mobileProps = { subPage }

    return <this.props.children {...childProps} {...mobileProps} />
  }
}

function makeMapStateToProps() {
  const getTier = makeGetTierAndVerifiedForUser()

  return (state: AppState) => {
    const userId = getUserId(state) ?? 0
    return {
      handle: getUserHandle(state),
      name: getUserName(state),
      isVerified: getAccountVerified(state),
      hasTracks: getAccountHasTracks(state),
      userId,
      profilePictureSizes: getAccountProfilePictureSizes(state),
      theme: getTheme(state),
      emailFrequency: getEmailFrequency(state),
      notificationSettings: getBrowserNotificationSettings(state),
      pushNotificationSettings: getPushNotificationSettings(state),
      tier: getTier(state, { userId }).tier
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setTheme: (theme: any) => dispatch(setTheme({ theme })),
    getNotificationSettings: () =>
      dispatch(settingPageActions.getNotificationSettings()),
    getPushNotificationSettings: () =>
      dispatch(settingPageActions.getPushNotificationSettings()),
    onTwitterLogin: (uuid: string, profile: TwitterProfile) =>
      dispatch(accountActions.twitterLogin({ uuid, profile })),
    onInstagramLogin: (uuid: string, profile: InstagramProfile) =>
      dispatch(accountActions.instagramLogin({ uuid, profile })),
    onTikTokLogin: (uuid: string, profile: TikTokProfile) =>
      dispatch(accountActions.tikTokLogin({ uuid, profile })),
    subscribeBrowserPushNotifications: () =>
      dispatch(accountActions.subscribeBrowserPushNotifications()),
    setBrowserNotificationSettingsOn: () =>
      dispatch(settingPageActions.setBrowserNotificationSettingsOn()),
    setBrowserNotificationSettingsOff: () =>
      dispatch(settingPageActions.setBrowserNotificationSettingsOff()),
    setNotificationSettings: (settings: object) =>
      dispatch(settingPageActions.setNotificationSettings(settings)),
    setBrowserNotificationEnabled: (enabled: boolean) =>
      dispatch(settingPageActions.setBrowserNotificationEnabled(enabled)),
    setBrowserNotificationPermission: (permission: Permission) =>
      dispatch(settingPageActions.setBrowserNotificationPermission(permission)),
    openBrowserPushPermissionModal: () =>
      dispatch(
        setVisibility({
          modal: 'BrowserPushPermissionConfirmation',
          visible: true
        })
      ),
    toggleNotificationSetting: (
      notificationType: BrowserNotificationSetting,
      isOn: boolean
    ) =>
      dispatch(
        settingPageActions.toggleNotificationSetting(notificationType, isOn)
      ),
    togglePushNotificationSetting: (
      notificationType: PushNotificationSetting,
      isOn: boolean
    ) =>
      dispatch(
        settingPageActions.togglePushNotificationSetting(notificationType, isOn)
      ),
    updateEmailFrequency: (frequency: EmailFrequency) =>
      dispatch(settingPageActions.updateEmailFrequency(frequency)),
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    goBack: () => dispatch(goBack()),
    recordThemeChange: (themeSettings: string) => {
      const theme =
        themeSettings === Theme.DEFAULT
          ? 'light'
          : themeSettings.toLocaleLowerCase()
      const trackEvent: TrackEvent = make(Name.SETTINGS_CHANGE_THEME, {
        mode: theme as 'dark' | 'light' | 'matrix' | 'auto'
      })
      dispatch(trackEvent)
    },
    recordSignOut: (callback?: () => void) => {
      const trackEvent: TrackEvent = make(Name.SETTINGS_LOG_OUT, { callback })
      dispatch(trackEvent)
    },
    recordAccountRecovery: () => {
      const trackEvent: TrackEvent = make(
        Name.SETTINGS_RESEND_ACCOUNT_RECOVERY,
        {}
      )
      dispatch(trackEvent)
    },
    recordDownloadDesktopApp: () => {
      dispatch(
        make(Name.ACCOUNT_HEALTH_DOWNLOAD_DESKTOP, { source: 'settings' })
      )
    },
    showMatrixConfetti: () => {
      dispatch(show())
    },
    signOut: () => {
      dispatch(signOut())
    }
  }
}

const g = withClassNullGuard(mapper)

export default connect(makeMapStateToProps, mapDispatchToProps)(g(SettingsPage))
