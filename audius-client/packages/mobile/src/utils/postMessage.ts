import { MessageType, Message } from '../message'

export type MessageSender = {
  postMessage: (message: string) => void
}

const SPAMMY_MESSAGES = new Set([MessageType.GET_POSITION])

// Stringifies the message, logs it, and sends it
export const postMessage = (sender: MessageSender, message: Message) => {
  const stringified = JSON.stringify(message)

  // Log it if it isn't spammy
  if (!SPAMMY_MESSAGES.has(message.type)) {
    console.debug(`Sending message to web client: ${stringified}`)
  }

  sender.postMessage(stringified)
}
