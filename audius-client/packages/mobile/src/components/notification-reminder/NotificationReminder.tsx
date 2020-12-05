import React, { RefObject, useCallback } from 'react'
import { checkNotifications, RESULTS } from 'react-native-permissions'

import { MessagePostingWebView } from '../../types/MessagePostingWebView'
import { postMessage } from '../../utils/postMessage'
import useSessionCount from '../../utils/useSessionCount'
import { MessageType } from '../../message'

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

const NotificationReminder = ({ webRef }: { webRef: RefObject<MessagePostingWebView> }) => {
    
  const remindUserToTurnOnNotifications = useCallback((count: number) => {
    if (webRef.current) {
      checkNotifications().then(({status}) => {
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
            postMessage(webRef.current, {
              type: MessageType.ENABLE_PUSH_NOTIFICATIONS_REMINDER,
              isAction: true
            })
        }
      }).catch((error) => {
        // Not sure what happened, but swallow the error. Not worth blocking on.
        console.error(error)
      })
    }
  }, [webRef])

  useSessionCount(remindUserToTurnOnNotifications, REMINDER_EVERY_N_SESSIONS)
  // No UI component
  return null
}

export default NotificationReminderWrapper
