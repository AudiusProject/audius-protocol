import { useContext, useEffect, FC } from 'react'

import { SquareSizes, Theme, ID } from '@audius/common/models'
import {
  BrowserNotificationSetting,
  PushNotificationSetting,
  EmailFrequency,
  InstagramProfile,
  TwitterProfile,
  TikTokProfile,
  Notifications,
  PushNotifications
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  SegmentedControl,
  IconAudiusLogoHorizontalColor
} from '@audius/harmony'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import GroupableList from 'components/groupable-list/GroupableList'
import Grouping from 'components/groupable-list/Grouping'
import Row from 'components/groupable-list/Row'
import NavContext, { LeftPreset } from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import useScrollToTop from 'hooks/useScrollToTop'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { isDarkMode } from 'utils/theme/theme'

import AboutSettingsPage from './AboutSettingsPage'
import AccountSettingsPage from './AccountSettingsPage'
import { ChangeEmailMobilePage } from './ChangeEmailPage'
import { ChangePasswordMobilePage } from './ChangePasswordPage'
import NotificationsSettingsPage from './NotificationsSettingsPage'
import styles from './SettingsPage.module.css'
import VerificationPage from './VerificationPage'

const {
  ACCOUNT_SETTINGS_PAGE,
  HISTORY_PAGE,
  ABOUT_SETTINGS_PAGE,
  NOTIFICATION_SETTINGS_PAGE
} = route

export enum SubPage {
  ACCOUNT = 'account',
  NOTIFICATIONS = 'notifications',
  ABOUT = 'about',
  VERIFICATION = 'verification',
  CHANGE_PASSWORD = 'change password',
  CHANGE_EMAIL = 'change email'
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
  goToRoute: (route: string) => void
  goBack: () => void
  isVerified: boolean
  onInstagramLogin: (uuid: string, profile: InstagramProfile) => void
  onTwitterLogin: (uuid: string, profile: TwitterProfile) => void
  onTikTokLogin: (uuid: string, profile: TikTokProfile) => void
  notificationSettings: Notifications
  emailFrequency: EmailFrequency
  pushNotificationSettings: PushNotifications

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
  recordSignOut: (callback?: () => void) => void
  showMatrix: boolean
}

export type SettingsPageProps = OwnProps

const SubPages = {
  [SubPage.ACCOUNT]: AccountSettingsPage as FC<SettingsPageProps>,
  [SubPage.ABOUT]: AboutSettingsPage as FC<SettingsPageProps>,
  [SubPage.NOTIFICATIONS]: NotificationsSettingsPage as FC<SettingsPageProps>,
  [SubPage.VERIFICATION]: VerificationPage as FC<SettingsPageProps>,
  [SubPage.CHANGE_PASSWORD]: ChangePasswordMobilePage as FC<SettingsPageProps>,
  [SubPage.CHANGE_EMAIL]: ChangeEmailMobilePage as FC<SettingsPageProps>
}

const SettingsPage = (props: SettingsPageProps) => {
  const {
    subPage,
    userId,
    name,
    handle,
    theme,
    toggleTheme,
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

  const profilePicture = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_150_BY_150
  })

  // Render out subPage if we're on one.
  if (subPage && subPage in SubPages) {
    const SubPageComponent = SubPages[subPage]
    return <SubPageComponent {...props} />
  }

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
      <SegmentedControl
        isMobile
        fullWidth
        options={options}
        selected={theme || Theme.DEFAULT}
        onSelectOption={(option) => toggleTheme(option)}
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
          <IconAudiusLogoHorizontalColor
            className={cn({
              [styles.whiteTint]: isDarkMode() || theme === Theme.MATRIX
            })}
          />
        </div>
        <GroupableList>
          <Grouping>
            <Row to={ACCOUNT_SETTINGS_PAGE}>
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
              to={HISTORY_PAGE}
            />
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small bell' />}
              title='Notifications'
              to={NOTIFICATION_SETTINGS_PAGE}
            />
            <Row
              prefix={<i className='emoji small waning-crescent-moon' />}
              title={messages.appearanceTitle}
              body={messages.appearance}
            >
              {renderThemeSlider()}
            </Row>
          </Grouping>
          <Grouping>
            <Row
              prefix={<i className='emoji small speech-balloon' />}
              title={messages.aboutTitle}
              to={ABOUT_SETTINGS_PAGE}
            />
          </Grouping>
        </GroupableList>
      </div>
    </Page>
  )
}

export default SettingsPage
