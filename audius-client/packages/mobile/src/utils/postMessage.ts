import { MessageType, Message } from "src/message"

export type MessageSender = {
  postMessage: (message: string) => void
}

export const postMessage = (sender: MessageSender, message: Message) => {
  const stringified = JSON.stringify(message)
  sender.postMessage(stringified)
}
