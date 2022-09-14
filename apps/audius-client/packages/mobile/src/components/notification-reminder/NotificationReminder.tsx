import { useCallback } from 'react'

import { accountSelectors } from '@audius/common'
import { checkNotifications, RESULTS } from 'react-native-permissions'
import { useDispatch, useSelector } from 'react-redux'
import type { Dispatch } from 'redux'

import useSessionCount from 'app/hooks/useSessionCount'
import { setVisibility } from 'app/store/drawers/slice'
const getHasAccount = accountSelectors.getHasAccount

const REMINDER_EVERY_N_SESSIONS = 10

export const NotificationReminder = () => {
  const hasAccount = useSelector(getHasAccount)
  if (hasAccount) {
    return <NotificationReminderInternal />
  }
  return null
}

const NotificationReminderInternal = () => {
  const dispatch = useDispatch()

  // Sets up reminders to turn on push notifications
  const reminder = useCallback(() => {
    remindUserToTurnOnNotifications(dispatch)
  }, [dispatch])

  useSessionCount(reminder, REMINDER_EVERY_N_SESSIONS)

  // No UI component
  return null
}

// Sends a notification to the WebApp to turn on push notifications if we're in the DENIED
// state. Is called from the `NotificationsReminder` component as well as `handleMessage`
export const remindUserToTurnOnNotifications = (dispatch: Dispatch) => {
  checkNotifications()
    .then(({ status }) => {
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
    })
    .catch((error) => {
      // Not sure what happened, but swallow the error. Not worth blocking on.
      console.error(error)
    })
}
