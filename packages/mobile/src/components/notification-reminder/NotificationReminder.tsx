import { useCallback } from 'react'

import { MobileOS } from '@audius/common/models'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getHasCompletedAccount } from 'common/store/pages/signon/selectors'
import { Platform } from 'react-native'
import { checkNotifications, RESULTS } from 'react-native-permissions'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import useSessionCount from 'app/hooks/useSessionCount'
import { setVisibility } from 'app/store/drawers/slice'

const FIRST_REMINDER_SESSION = 10
const REMINDER_FREQUENCY = 10

export const NotificationReminder = () => {
  const hasCompletedAccount = useSelector(getHasCompletedAccount)

  if (hasCompletedAccount) {
    return <NotificationReminderInternal />
  }
  return null
}

const NotificationReminderInternal = () => {
  const dispatch = useDispatch()

  const remindUserToTurnOnNotifications = useCallback(async () => {
    try {
      const { status } = await checkNotifications()
      switch (status) {
        case RESULTS.UNAVAILABLE:
          // Notifications are not available (on this device / in this context).
          // Do nothing.
          return
        case RESULTS.LIMITED:
          // Some subset of notification features are enabled, let the user be.
          // Do nothing.
          return
        case RESULTS.GRANTED:
          // The user already has given notifications permissions!
          // Do nothing.
          return
        case RESULTS.BLOCKED:
          // The user has explicitly blocked notifications.
          // Don't be a jerk.
          // Do nothing.
          return
        case RESULTS.DENIED:
          // The permission has not been requested or has been denied but it still requestable
          // Appeal to the user to enable notifications
          dispatch(
            setVisibility({ drawer: 'EnablePushNotifications', visible: true })
          )
      }
    } catch (error) {
      // Not sure what happened, but swallow the error. Not worth blocking on.
      console.error(error)
    }
  }, [dispatch])

  useAsync(async () => {
    /**
     * In 1.5.78, we fixed a bug where Android notifs weren't working due to incorrect manifest perms.
     * However once the correct perms were added it still didn't automatically "re-enable" notifs for users.
     * So, we needed a way to one-time retrigger the notifs reminder modal
     * We landed on this approach using AsyncStorage to track if we've retriggered the notifs drawer or not
     * This value should be one-time-use (created & set to true in the same session)
     */
    const hasRetriggeredNotifs = await AsyncStorage.getItem('RETRIGGER_NOTIFS')
    const isAndroid = Platform.OS === MobileOS.ANDROID

    if (hasRetriggeredNotifs === null && isAndroid) {
      // Not set at all yet - this was introduced in 1.5.78 for a
      await AsyncStorage.setItem('RETRIGGER_NOTIFS', 'false')
    } else {
      // Only retrigger the notifs drawer if this is our first time seeing this new async key
      if (hasRetriggeredNotifs !== 'true') {
        remindUserToTurnOnNotifications()
        await AsyncStorage.setItem('RETRIGGER_NOTIFS', 'true')
      }
    }
  })

  // Sets up reminders to turn on push notifications every time the reminder frequency is met
  useSessionCount(
    remindUserToTurnOnNotifications,
    REMINDER_FREQUENCY,
    FIRST_REMINDER_SESSION
  )

  // No UI component
  return null
}
