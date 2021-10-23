import React, { useContext, useEffect, useCallback } from 'react'

import cn from 'classnames'

import horizontalLogo from 'assets/img/settingsPageLogo.png'
import { ID } from 'common/models/Identifiers'
import { SquareSizes, ProfilePictureSizes } from 'common/models/ImageSizes'
import { InstagramProfile, TwitterProfile } from 'common/store/account/reducer'
import TabSlider from 'components/data-entry/TabSlider'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Page from 'components/general/Page'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import NavContext, { LeftPreset } from 'containers/nav/store/context'
import { useUserProfilePicture } from 'hooks/useImageSize'
import useScrollToTop from 'hooks/useScrollToTop'
import Theme from 'models/Theme'
import { getIsIOS } from 'utils/browser'
import {
  ACCOUNT_SETTINGS_PAGE,
  HISTORY_PAGE,
  ABOUT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE
} from 'utils/route'
import { isDarkMode } from 'utils/theme/theme'

import {
  Notifications,
  EmailFrequency,
  BrowserNotificationSetting,
  PushNotificationSetting,
  PushNotifications,
  Cast
} from '../../store/types'

import AboutSettingsPage from './AboutSettingsPage'
import AccountSettingsPage from './AccountSettingsPage'
import { ChangePasswordPage } from './ChangePasswordPage'
import NotificationsSettingsPage from './NotificationsSettingsPage'
import styles from './SettingsPage.module.css'
import VerificationPage from './VerificationPage'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export enum SubPage {
  ACCOUNT = 'account',
  NOTIFICATIONS = 'notifications',
  ABOUT = 'about',
  VERIFICATION = 'verification',
  CHANGE_PASSWORD = 'change-password'
}

const messages = {
  pageTitle: 'Settings',
  appearanceTitle: 'Appearance',
  appearance:
    'Enable dark mode or choose ‘Auto’ to change with your system settings',
  aboutTitle: 'About',
  cast: 'Select your prefered casting method.',
  title: 'Settings',
  description: 'Configure your Audius account',
  historyTitle: 'Listening History',
  matrixMode: 'Matrix'
}

type OwnProps = {
  title: string
  description: string
  subPage?: SubPage
  userId: ID
  handle: string
  name: string
  theme: Theme | null
  toggleTheme: (theme: any) => void
  profilePictureSizes: ProfilePictureSizes | null
  goToRoute: (route: string) => void
  goBack: () => void
  isVerified: boolean
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  notificationSettings: Notifications
  emailFrequency: EmailFrequency
  pushNotificationSettings: PushNotifications
  castMethod: Cast

  getNotificationSettings: () => void
  getPushNotificationSettings: () => void
  toggleBrowserPushNotificationPermissions: (
    notificationType: BrowserNotificationSetting,
    isOn: boolean
  ) => void
  togglePushNotificationSetting: (
    notificationType: PushNotificationSetting,
    isOn: boolean
  ) => void
  updateEmailFrequency: (frequency: EmailFrequency) => void
  updateCastMethod: (castMethod: Cast) => void
  recordSignOut: (callback?: () => void) => void
  showMatrix: boolean
}

export type SettingsPageProps = OwnProps

const SubPages = {
  [SubPage.ACCOUNT]: AccountSettingsPage as React.FC<SettingsPageProps>,
  [SubPage.ABOUT]: AboutSettingsPage as React.FC<SettingsPageProps>,
  [SubPage.NOTIFICATIONS]: NotificationsSettingsPage as React.FC<
    SettingsPageProps
  >,
  [SubPage.VERIFICATION]: VerificationPage as React.FC<SettingsPageProps>,
  [SubPage.CHANGE_PASSWORD]: ChangePasswordPage as React.FC<SettingsPageProps>
}

const SettingsPage = (props: SettingsPageProps) => {
  const {
    subPage,
    userId,
    name,
    handle,
    profilePictureSizes,
    theme,
    toggleTheme,
    goToRoute,
    castMethod,
    updateCastMethod,
    getNotificationSettings,
    getPushNotificationSettings,
    showMatrix
  } = props
  useScrollToTop()

  useEffect(() => {
    getPushNotificationSettings()
  }, [getPushNotificationSettings])

  useEffect(() => {
    getNotificationSettings()
  }, [getNotificationSettings])

  // Set Nav-Bar Menu
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(subPage ? LeftPreset.BACK : LeftPreset.CLOSE_NO_ANIMATION)
    setRight(null)
    setCenter(subPage || messages.pageTitle)
  }, [setLeft, setCenter, setRight, subPage])

  const profilePicture = useUserProfilePicture(
    userId,
    profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  const goToHistoryPage = useCallback(() => {
    goToRoute(HISTORY_PAGE)
  }, [goToRoute])

  const goToAccountSettingsPage = useCallback(() => {
    goToRoute(ACCOUNT_SETTINGS_PAGE)
  }, [goToRoute])

  const goToAboutSettingsPage = useCallback(() => {
    goToRoute(ABOUT_SETTINGS_PAGE)
  }, [goToRoute])

  const goToNotificationsSettingsPage = useCallback(() => {
    goToRoute(NOTIFICATION_SETTINGS_PAGE)
  }, [goToRoute])

  // Render out subPage if we're on one.
  if (subPage && subPage in SubPages) {
    const SubPageComponent = SubPages[subPage]
    return <SubPageComponent {...props} />
  }
  const isIOS = getIsIOS()

  const renderThemeSlider = () => {
    const options = [
      {
        key: Theme.AUTO,
        text: 'Auto'
      },
      {
        key: Theme.DARK,
        text: 'Dark'
      },
      {
        key: Theme.DEFAULT,
        text: 'Light'
      }
    ]

    if (showMatrix) {
      options.push({ key: Theme.MATRIX, text: messages.matrixMode })
    }

    return (
      <TabSlider
        isMobile
        fullWidth
        options={options}
        selected={theme || Theme.DEFAULT}
        onSelectOption={option => toggleTheme(option)}
        key={`tab-slider-${options.length}`}
      />
    )
  }
  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContent}
      containerClassName={styles.page}
    >
      <div className={styles.bodyContainer}>
        <div className={styles.logo}>
          <img
            src={horizontalLogo}
            alt='Audius Logo'
            className={cn({
              [styles.whiteTint]: isDarkMode() || theme === Theme.MATRIX
            })}
          />
        </div>
        <GroupableList>
          <Grouping>
            <Row onClick={goToAccountSettingsPage}>
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
            </Row>
            <Row
              prefix={<i className='emoji small headphone' />}
              title={messages.historyTitle}
              onClick={goToHistoryPage}
            />
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small bell' />}
              title='Notifications'
              onClick={goToNotificationsSettingsPage}
            />
            <Row
              prefix={<i className='emoji small waning-crescent-moon' />}
              title={messages.appearanceTitle}
              body={messages.appearance}
            >
              {renderThemeSlider()}
            </Row>
            {isIOS && NATIVE_MOBILE && (
              <Row
                prefix={
                  <i className='emoji small speaker-with-three-sound-waves' />
                }
                title='Cast to Devices'
                body={messages.cast}
              >
                <TabSlider
                  isMobile
                  fullWidth
                  options={[
                    {
                      key: Cast.AIRPLAY,
                      text: 'Airplay'
                    },
                    {
                      key: Cast.CHROMECAST,
                      text: 'Chromecast'
                    }
                  ]}
                  selected={castMethod}
                  onSelectOption={(option: Cast) => {
                    updateCastMethod(option)
                  }}
                />
              </Row>
            )}
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small speech-balloon' />}
              title={messages.aboutTitle}
              onClick={goToAboutSettingsPage}
            />
          </Grouping>
        </GroupableList>
      </div>
    </Page>
  )
}

export default SettingsPage
