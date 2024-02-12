import { useState, useCallback, useEffect } from 'react'

import {
  accountActions,
  settingsPageSelectors,
  settingsPageActions as settingPageActions,
  modalsSelectors,
  modalsActions
} from '@audius/common/store'
import { Modal, Anchor, Button, ButtonType, ButtonSize } from '@audius/stems'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useIsMobile } from 'hooks/useIsMobile'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { AppState } from 'store/types'
import {
  isPushManagerAvailable,
  isSafariPushAvailable,
  subscribeSafariPushBrowser,
  Permission
} from 'utils/browserNotifications'
import { isElectron } from 'utils/clientUtil'

import styles from './BrowserPushConfirmationModal.module.css'
const { setVisibility } = modalsActions
const { getModalVisibility } = modalsSelectors
const { getBrowserNotificationSettings } = settingsPageSelectors

const { subscribeBrowserPushNotifications } = accountActions

type BrowserPushConfirmationModal = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const messages = {
  title: (
    <h2>
      {"DON'T MISS A THING! "}
      <span className={styles.bell}>
        <i className='emoji bell' />
      </span>
    </h2>
  ),
  description:
    'Turn on browser notifications to be notified when your favorite artists release new content!',
  reason:
    'You’ll also be notified whenever someone follows, reposts, or favorites your tracks!',
  close: 'Maybe Later',
  confirm: 'Enable Browser Notifications!'
}

/**
 * A modal that asks the user to condfirm browser notifications
 */
const ConnectedBrowserPushConfirmationModal = ({
  isOpen,
  onClose,
  browserNotificationSettings,
  setBrowserNotificationPermission,
  subscribeBrowserPushNotifications
}: BrowserPushConfirmationModal) => {
  const { permission } = browserNotificationSettings
  const [pushPermission] = useState(permission)
  const isMobile = useIsMobile()

  const onEnabled = useCallback(() => {
    let cancelled = false
    if (permission !== Permission.DENIED) {
      if (isPushManagerAvailable) {
        subscribeBrowserPushNotifications()
        if (permission === Permission.GRANTED) onClose()
      } else if (isSafariPushAvailable) {
        // NOTE: The request browser permission must be done directly
        // b/c safari requires the user action to trigger the permission request
        if (permission === Permission.GRANTED) {
          subscribeBrowserPushNotifications()
        } else {
          const getSafariPermission = async () => {
            const permissionData = await subscribeSafariPushBrowser(
              audiusBackendInstance
            )
            if (
              permissionData &&
              permissionData.permission === Permission.GRANTED
            ) {
              subscribeBrowserPushNotifications()
              if (!cancelled) onClose()
            } else if (
              permissionData &&
              permissionData.permission === Permission.DENIED
            ) {
              setBrowserNotificationPermission(Permission.DENIED)
            }
          }
          getSafariPermission()
        }
      }
    }
    onClose()
    return () => {
      cancelled = true
    }
  }, [
    permission,
    subscribeBrowserPushNotifications,
    onClose,
    setBrowserNotificationPermission
  ])

  // If permission changed, close modal
  useEffect(() => {
    if (permission && pushPermission && permission !== pushPermission) {
      onClose()
    }
  }, [permission, pushPermission, onClose])

  return (
    <Modal
      showTitleHeader
      showDismissButton
      onClose={onClose}
      isOpen={isOpen && !isElectron()}
      anchor={Anchor.CENTER}
      title={messages.title}
      titleClassName={styles.title}
      wrapperClassName={cn(styles.wrapperClassName, {
        [styles.mobile]: isMobile
      })}
      headerContainerClassName={styles.headerContainerClassName}
      bodyClassName={styles.modalBody}
      contentHorizontalPadding={24}
      allowScroll={false}
    >
      <div>
        <div className={styles.textBody}>
          <div className={styles.description}>{messages.description}</div>
          <div className={styles.reason}>{messages.reason}</div>
        </div>

        <div className={styles.buttons}>
          <Button
            className={styles.closeButton}
            text={messages.close.toUpperCase()}
            size={ButtonSize.MEDIUM}
            type={ButtonType.COMMON}
            onClick={onClose}
          />
          <Button
            className={styles.enableButton}
            text={messages.confirm.toUpperCase()}
            size={ButtonSize.MEDIUM}
            type={ButtonType.PRIMARY_ALT}
            onClick={onEnabled}
          />
        </div>
      </div>
    </Modal>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isOpen: getModalVisibility(state, 'BrowserPushPermissionConfirmation'),
    browserNotificationSettings: getBrowserNotificationSettings(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    subscribeBrowserPushNotifications: () =>
      dispatch(subscribeBrowserPushNotifications()),
    setBrowserNotificationPermission: (permission: Permission) =>
      dispatch(settingPageActions.setBrowserNotificationPermission(permission)),
    setBrowserNotificationEnabled: (enabled: boolean) =>
      dispatch(settingPageActions.setBrowserNotificationEnabled(enabled)),
    setNotificationSettings: (settings: object) =>
      dispatch(settingPageActions.setNotificationSettings(settings)),
    onClose: () =>
      dispatch(
        setVisibility({
          modal: 'BrowserPushPermissionConfirmation',
          visible: false
        })
      )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedBrowserPushConfirmationModal)
