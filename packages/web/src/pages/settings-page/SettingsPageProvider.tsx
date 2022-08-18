import { ComponentType, PureComponent } from 'react'

import { Name, Theme } from '@audius/common'
import { push as pushRoute, goBack } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import * as accountActions from 'common/store/account/reducer'
import {
  getAccountVerified,
  getAccountHasTracks,
  getAccountProfilePictureSizes,
  getUserId,
  getUserHandle,
  getUserName
} from 'common/store/account/selectors'
import { make, TrackEvent } from 'common/store/analytics/actions'
import { getMethod as getCastMethod } from 'common/store/cast/selectors'
import { CastMethod, updateMethod } from 'common/store/cast/slice'
import * as settingPageActions from 'common/store/pages/settings/actions'
import {
  getBrowserNotificationSettings,
  getPushNotificationSettings,
  getEmailFrequency
} from 'common/store/pages/settings/selectors'
import {
  BrowserNotificationSetting,
  EmailFrequency,
  PushNotificationSetting
} from 'common/store/pages/settings/types'
import { setVisibility } from 'common/store/ui/modals/slice'
import { setTheme } from 'common/store/ui/theme/actions'
import { getTheme } from 'common/store/ui/theme/selectors'
import { makeGetTierAndVerifiedForUser } from 'common/store/wallet/utils'
import { show } from 'components/music-confetti/store/slice'
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

const isStaging = process.env.REACT_APP_ENVIRONMENT === 'staging'

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
    } else if (
      this.props.notificationSettings.permission === Permission.GRANTED
    ) {
      // Permission is already granted, don't need to popup confirmation modal.
      this.props.setBrowserNotificationEnabled(true)
      this.props.setBrowserNotificationSettingsOn()
    } else {
      if (isPushManagerAvailable) {
        this.props.subscribeBrowserPushNotifications()
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
      castMethod,
      onTwitterLogin,
      onInstagramLogin,
      toggleNotificationSetting,
      togglePushNotificationSetting,
      updateEmailFrequency,
      updateCastMethod,
      goToRoute,
      goBack,
      recordSignOut,
      recordAccountRecovery,
      recordDownloadDesktopApp,
      tier
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
      toggleNotificationSetting,
      toggleBrowserPushNotificationPermissions:
        this.toggleBrowserPushNotificationPermissions,
      togglePushNotificationSetting,
      updateEmailFrequency,
      recordDownloadDesktopApp,
      goToRoute,
      goBack,
      showMatrix
    }

    const mobileProps = {
      subPage,
      castMethod,
      updateCastMethod
    }

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
      castMethod: getCastMethod(state),
      tier: getTier(state, { userId }).tier
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setTheme: (theme: any) => dispatch(setTheme(theme)),
    getNotificationSettings: () =>
      dispatch(settingPageActions.getNotificationSettings()),
    getPushNotificationSettings: () =>
      dispatch(settingPageActions.getPushNotificationSettings()),
    onTwitterLogin: (uuid: string, profile: accountActions.TwitterProfile) =>
      dispatch(accountActions.twitterLogin({ uuid, profile })),
    onInstagramLogin: (
      uuid: string,
      profile: accountActions.InstagramProfile
    ) => dispatch(accountActions.instagramLogin({ uuid, profile })),
    subscribeBrowserPushNotifications: () =>
      dispatch(accountActions.subscribeBrowserPushNotifications()),
    setBrowserNotificationSettingsOn: () =>
      dispatch(settingPageActions.setBrowserNotificationSettingsOn()),
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
    updateCastMethod: (castMethod: CastMethod) => {
      dispatch(updateMethod({ method: castMethod }))
    },
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
    }
  }
}

const g = withClassNullGuard(mapper)

export default connect(makeMapStateToProps, mapDispatchToProps)(g(SettingsPage))
