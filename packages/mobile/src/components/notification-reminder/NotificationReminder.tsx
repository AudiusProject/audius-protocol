import { useCallback } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { getHasCompletedAccount } from 'common/store/pages/signon/selectors'
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
    console.log('Reminding user')
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
          return
      }
    } catch (error) {
      // Not sure what happened, but swallow the error. Not worth blocking on.
      console.error(error)
    }
  }, [dispatch])

  useAsync(async () => {
    const hasRetriggeredNotifs = await AsyncStorage.getItem('RETRIGGER_NOTIFS')
    if (hasRetriggeredNotifs === null) {
      // Not set at all yet - new patch
      await AsyncStorage.setItem('RETRIGGER_NOTIFS', 'false')
    } else {
      // if (hasRetriggeredNotifs === 'true') {
      if (hasRetriggeredNotifs !== 'true') {
        console.log('Needs retriggering', { hasRetriggeredNotifs })
        remindUserToTurnOnNotifications()
        await AsyncStorage.setItem('RETRIGGER_NOTIFS', 'true')
      } else {
        console.log('Doesnt need retriggering', { hasRetriggeredNotifs })
      }
    }
  })

  // Sets up reminders to turn on push notifications

  useSessionCount(
    remindUserToTurnOnNotifications,
    REMINDER_FREQUENCY,
    FIRST_REMINDER_SESSION
  )

  // No UI component
  return null
}
