import React, { Component } from 'react'
import cn from 'classnames'
import {
  Modal,
  Button,
  ButtonType,
  IconMail,
  IconNotification,
  IconSignOut
} from '@audius/stems'

import DownloadApp from 'services/download-app/DownloadApp'
import AudiusBackend from 'services/AudiusBackend'
import { signOut } from 'utils/signOut'
import { isMobile, isElectron, getOS } from 'utils/clientUtil'
import SelectedServices from 'containers/service-selection/SelectedServices'
import ConfirmationBox from 'components/general/ConfirmationBox'
import Header from 'components/general/header/desktop/Header'
import Page from 'components/general/Page'
import Toast from 'components/toast/Toast'
import { ComponentPlacement } from 'components/types'
import {
  Notifications,
  BrowserNotificationSetting,
  EmailFrequency
} from '../../store/types'

import TabSlider from 'components/data-entry/TabSlider'
import Theme from 'models/Theme'

import { version } from '../../../../../package.json'

import NotificationSettings from './NotificationSettings'
import styles from './SettingsPage.module.css'
import VerificationModal from './VerificationModal'
import SettingsCard from './SettingsCard'
import { OS } from 'models/OS'
import audiusIcon from 'assets/img/audiusIcon.png'
import { ProfilePictureSizes } from 'models/common/ImageSizes'
import { ID } from 'models/common/Identifiers'
import { InstagramProfile } from 'store/account/reducer'

const SIGN_OUT_MODAL_TEXT = `
  Are you sure you want to sign out?
  Double check that you have an account recovery email just in case (resend from your settings).
`

const EMAIL_TOAST_TIMEOUT = 2000

const messages = {
  version: 'Audius Version',
  copyright: 'Copyright © 2019 Audius',
  emailSent: 'Email Sent!',
  emailNotSent: 'Something broke! Please try again!',
  darkModeOn: 'On',
  darkModeOff: 'Off',
  darkModeAuto: 'Auto',
  verifiedTitle: 'Verified on twitter or Instagram?',
  getVerified: 'Get verified by linking a verified social account to Audius',
  matrixMode: '🕳 🐇 Matrix'
}

type OwnProps = {
  title: string
  description: string
  isVerified: boolean
  isCreator: boolean
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
  onTwitterLogin: (uuid: string, profile: Record<string, any>) => void
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
}

export type SettingsPageProps = OwnProps

type SettingsPageState = {
  showNotificationSettings: boolean
  showModalSignOut: boolean
  emailToastText: string
}

class SettingsPage extends Component<SettingsPageProps, SettingsPageState> {
  state = {
    showNotificationSettings: false,
    showModalSignOut: false,
    emailToastText: ''
  }

  componentDidMount() {
    this.props.getNotificationSettings()
  }

  showModalSignOut = () => {
    this.setState({ showModalSignOut: true })
  }

  closeModalSignOut = () => {
    this.setState({ showModalSignOut: false })
  }

  showNotificationSettings = () => {
    this.setState({ showNotificationSettings: true })
  }

  closeNotificationSettings = () => {
    this.setState({ showNotificationSettings: false })
  }

  onSignOut = () => {
    this.props.recordSignOut(signOut)
  }

  showEmailToast = async () => {
    try {
      await AudiusBackend.sendRecoveryEmail()
      this.setState({ emailToastText: messages.emailSent })
      this.props.recordAccountRecovery()
    } catch (e) {
      this.setState({ emailToastText: messages.emailNotSent })
    }
    setTimeout(() => {
      this.setState({ emailToastText: '' })
    }, EMAIL_TOAST_TIMEOUT)
  }

  downloadDesktopApp = () => {
    DownloadApp.start(getOS() || OS.WIN)
    this.props.recordDownloadDesktopApp()
  }

  renderThemeCard() {
    const { showMatrix, theme, toggleTheme } = this.props

    const options = [
      {
        key: Theme.DEFAULT,
        text: messages.darkModeOff
      },
      {
        key: Theme.DARK,
        text: messages.darkModeOn
      },
      {
        key: Theme.AUTO,
        text: messages.darkModeAuto
      }
    ]
    if (showMatrix) {
      options.push({ key: Theme.MATRIX, text: messages.matrixMode })
    }

    return (
      <SettingsCard
        title='Dark Mode'
        description="Enable dark mode or choose 'Auto' to change with your system settings"
      >
        <TabSlider
          options={options}
          selected={theme || Theme.DEFAULT}
          onSelectOption={option => toggleTheme(option)}
        />
      </SettingsCard>
    )
  }

  render() {
    const {
      title,
      description,
      isVerified,
      isCreator,
      userId,
      handle,
      name,
      profilePictureSizes,
      onInstagramLogin,
      goToRoute,
      onTwitterLogin,
      notificationSettings,
      emailFrequency,
      toggleBrowserPushNotificationPermissions,
      toggleNotificationSetting,
      updateEmailFrequency
    } = this.props

    const header = <Header primary={'Settings'} />

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
            title={messages.verifiedTitle}
            description={messages.getVerified}
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
            />
          </SettingsCard>
          {!isMobile() && !isElectron() && (
            <SettingsCard
              title='Get Our Desktop App'
              description='For the best experience, we recommend downloading the Audius Desktop App'
            >
              <Button
                onClick={this.downloadDesktopApp}
                className={cn(styles.cardButton, styles.downloadButton)}
                textClassName={styles.settingButtonText}
                type={ButtonType.COMMON_ALT}
                text='Get App'
                leftIcon={
                  <img
                    alt='Audius Icon'
                    src={audiusIcon}
                    style={{ width: '24px', height: '24px' }}
                  />
                }
              />
            </SettingsCard>
          )}
          <SettingsCard
            title='Account Recovery Email'
            description='Resend your password reset email and store it safely. This email is the only way to recover your account if you forget your password.'
          >
            <Toast
              text={this.state.emailToastText}
              open={!!this.state.emailToastText}
              placement={ComponentPlacement.RIGHT}
              fillParent={false}
            >
              <Button
                onClick={this.showEmailToast}
                className={cn(styles.cardButton, styles.resetButton)}
                textClassName={styles.settingButtonText}
                iconClassName={styles.resetButtonIcon}
                type={ButtonType.COMMON_ALT}
                text='Resend'
                leftIcon={<IconMail />}
              />
            </Toast>
          </SettingsCard>
          {this.renderThemeCard()}
          <SettingsCard
            title='NOTIFICATIONS'
            description='Review your notifications preferences'
          >
            <Button
              onClick={this.showNotificationSettings}
              className={cn(styles.cardButton, styles.resetButton)}
              textClassName={styles.settingButtonText}
              type={ButtonType.COMMON_ALT}
              text='Review'
              leftIcon={<IconNotification className={styles.reviewIcon} />}
            />
          </SettingsCard>
        </div>
        <div className={styles.version}>
          <Button
            className={styles.signOutButton}
            textClassName={styles.signOutButtonText}
            iconClassName={styles.signOutButtonIcon}
            type={ButtonType.COMMON_ALT}
            text='Sign Out'
            name='sign-out'
            leftIcon={<IconSignOut />}
            onClick={this.showModalSignOut}
          />
          <span>{`${messages.version} ${version}`}</span>
          <span>{messages.copyright}</span>
        </div>
        <div className={styles.selectedServices}>
          {isCreator && <SelectedServices variant='lighter' />}
        </div>
        <Modal
          title={
            <>
              Hold Up! <i className='emoji waving-hand-sign' />
            </>
          }
          isOpen={this.state.showModalSignOut}
          onClose={this.closeModalSignOut}
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
            rightClick={this.closeModalSignOut}
            leftClick={this.onSignOut}
          />
        </Modal>
        <NotificationSettings
          isOpen={this.state.showNotificationSettings}
          toggleBrowserPushNotificationPermissions={
            toggleBrowserPushNotificationPermissions
          }
          toggleNotificationSetting={toggleNotificationSetting}
          updateEmailFrequency={updateEmailFrequency}
          settings={notificationSettings}
          emailFrequency={emailFrequency}
          onClose={this.closeNotificationSettings}
        />
      </Page>
    )
  }
}

export default SettingsPage
