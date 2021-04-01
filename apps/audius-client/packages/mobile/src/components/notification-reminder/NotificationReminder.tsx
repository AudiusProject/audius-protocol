import React, { RefObject, useCallback } from 'react'
import { checkNotifications, RESULTS } from 'react-native-permissions'

import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { postMessage as postMessageUtil } from '../../utils/postMessage'
import useSessionCount from '../../utils/useSessionCount'
import { Message, MessageType } from '../../message'

const REMINDER_EVERY_N_SESSIONS = 10

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
  isSignedIn: boolean
}

const NotificationReminderWrapper = ({ webRef, isSignedIn }: OwnProps) => {
  if (isSignedIn) {
    return <NotificationReminder webRef={webRef} />
  }
  return null
}

// Sends a notification to the WebApp to turn on push notifications if we're in the DENIED
// state. Is called from the `NotificationsReminder` component as well as `handleMessage`
export const remindUserToTurnOnNotifications = (
  postMessage: (message: Message) => void
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
          postMessage({
            type: MessageType.ENABLE_PUSH_NOTIFICATIONS_REMINDER,
            isAction: true
          })
      }
    })
    .catch(error => {
      // Not sure what happened, but swallow the error. Not worth blocking on.
      console.error(error)
    })
}

const NotificationReminder = ({
  webRef
}: {
  webRef: RefObject<MessagePostingWebView>
}) => {
  // Sets up reminders to turn on push notifications
  const reminder = useCallback(() => {
    const sender = webRef.current
    if (!sender) return
    remindUserToTurnOnNotifications((msg: Message) =>
      postMessageUtil(sender, msg)
    )
  }, [webRef])
  useSessionCount(reminder, REMINDER_EVERY_N_SESSIONS)
  // No UI component
  return null
}

export default NotificationReminderWrapper
