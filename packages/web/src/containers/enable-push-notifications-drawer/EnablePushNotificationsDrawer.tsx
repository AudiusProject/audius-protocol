import React, { useCallback } from 'react'

import {
  Button,
  ButtonType,
  IconCoSign,
  IconExploreNewReleases,
  IconFollow,
  IconHeart,
  IconRemix,
  IconRepost
} from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconNotification } from 'assets/img/iconGradientNotification.svg'
import Drawer from 'components/drawer/Drawer'
import { togglePushNotificationSetting } from 'containers/settings-page/store/actions'
import { PushNotificationSetting } from 'containers/settings-page/store/types'

import styles from './EnablePushNotificationsDrawer.module.css'
import { getIsOpen } from './store/selectors'
import { hide } from './store/slice'

const messages = {
  dontMiss: `Don't Miss a Beat!`,
  turnOn: 'Turn on Notifications',
  favorites: 'Favorites',
  reposts: 'Reposts',
  followers: 'Followers',
  coSigns: 'Co-Signs',
  remixes: 'Remixes',
  newReleases: 'New Releases'
}

const EnablePushNotificationsDrawer = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(getIsOpen)

  const onClose = useCallback(() => {
    dispatch(hide())
  }, [dispatch])

  const enablePushNotifications = useCallback(() => {
    dispatch(
      togglePushNotificationSetting(PushNotificationSetting.MobilePush, true)
    )
    onClose()
  }, [dispatch, onClose])

  return (
    <Drawer isOpen={isOpen} onClose={onClose} shouldClose={!isOpen}>
      <div className={styles.drawer}>
        <div className={styles.top}>
          <div className={styles.cta}>
            <IconNotification className={styles.iconNotification} />
            <div>{messages.dontMiss}</div>
          </div>
          <div className={styles.turnOn}>{messages.turnOn}</div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.actions}>
            <div className={styles.action}>
              <IconHeart />
              {messages.favorites}
            </div>
            <div className={styles.action}>
              <IconRepost />
              {messages.reposts}
            </div>
            <div className={styles.action}>
              <IconFollow />
              {messages.followers}
            </div>
            <div className={styles.action}>
              <IconCoSign className={styles.coSign} />
              {messages.coSigns}
            </div>
            <div className={styles.action}>
              <IconRemix />
              {messages.remixes}
            </div>
            <div className={styles.action}>
              <IconExploreNewReleases />
              {messages.newReleases}
            </div>
          </div>
        </div>
        <Button
          type={ButtonType.PRIMARY_ALT}
          text='Enable Notifications'
          onClick={enablePushNotifications}
        />
      </div>
    </Drawer>
  )
}

export default EnablePushNotificationsDrawer
