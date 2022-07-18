import { Maybe } from 'audius-client/src/common/utils/typeUtils'

import { MessageType, Message } from '../message'

export type MessageSender = {
  postMessage: (message: string) => void
}

const IGNORE_MESSAGES = new Set<string>([
  MessageType.GET_POSITION,
  MessageType.SUBMIT_SIGNIN,
  MessageType.SUBMIT_SIGNUP,
  MessageType.SIGN_UP_VALIDATE_AND_CHECK_EMAIL,
  MessageType.SIGN_UP_VALIDATE_EMAIL_SUCCESS,
  MessageType.SIGN_UP_VALIDATE_EMAIL_FAILURE,
  MessageType.SIGN_UP_VALIDATE_HANDLE,
  MessageType.SIGN_UP_VALIDATE_HANDLE_SUCCESS,
  MessageType.SIGN_UP_VALIDATE_HANDLE_FAILURE,
  MessageType.SIGN_UP_SUCCESS
])

// Stringifies the message, logs it, and sends it
export const postMessage = (sender: Maybe<MessageSender>, message: Message) => {
  const stringified = JSON.stringify(message)

  // Log it if it isn't spammy / meant to be ignored
  if (!IGNORE_MESSAGES.has(message.type)) {
    console.debug(`Sending message to web client: ${stringified}`)
  }

  // On some versions of android the MessageSender isn't available for a short period on
  // startup. Logging more info to determine culprit message
  if (!sender) {
    throw new Error(
      `MessageSender undefined. Trying to post message: ${stringified}`
    )
  }

  sender.postMessage(stringified)
}
