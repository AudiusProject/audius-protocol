import React, { useCallback } from 'react'
import { checkNotifications, RESULTS } from 'react-native-permissions'

import { useDrawer } from '../../hooks/useDrawer'
import useSessionCount from '../../hooks/useSessionCount'

const REMINDER_EVERY_N_SESSIONS = 10

type OwnProps = {
  isSignedIn: boolean
}

const NotificationReminderWrapper = ({ isSignedIn }: OwnProps) => {
  if (isSignedIn) {
    return <NotificationReminder />
  }
  return null
}

// Sends a notification to the WebApp to turn on push notifications if we're in the DENIED
// state. Is called from the `NotificationsReminder` component as well as `handleMessage`
export const remindUserToTurnOnNotifications = (
  setIsReminderOpen: (isVisible: boolean) => void
) => {
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
          setIsReminderOpen(true)
      }
    })
    .catch(error => {
      // Not sure what happened, but swallow the error. Not worth blocking on.
      console.error(error)
    })
}

const NotificationReminder = () => {
  const [_, setIsOpen] = useDrawer('EnablePushNotifications')

  // Sets up reminders to turn on push notifications
  const reminder = useCallback(() => {
    remindUserToTurnOnNotifications(setIsOpen)
  }, [setIsOpen])

  useSessionCount(reminder, REMINDER_EVERY_N_SESSIONS)

  // No UI component
  return null
}

export default NotificationReminderWrapper
