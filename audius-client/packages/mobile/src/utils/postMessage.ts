import { Maybe } from 'audius-client/src/common/utils/typeUtils'

import { MessageType, Message } from '../message'

export type MessageSender = {
  postMessage: (message: string) => void
}

const SPAMMY_MESSAGES = new Set<string>([MessageType.GET_POSITION])

// Stringifies the message, logs it, and sends it
export const postMessage = (sender: Maybe<MessageSender>, message: Message) => {
  const stringified = JSON.stringify(message)

  // Log it if it isn't spammy
  if (!SPAMMY_MESSAGES.has(message.type)) {
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
