import { uuid } from '@audius/common'

import { Message, MessageType } from './types'

/* Message Receiving */

type ResponseQueue = {
  [id: string]: Message
}

// A persisted queue of responses received from sending requests
const responseQueue: ResponseQueue = {}
// @ts-ignore
window.responseQueue = responseQueue

// Pull the correct response off of the response queue
const getResponse = async (id: string): Promise<Message> => {
  // eslint-disable-next-line
  while (!(id in responseQueue)) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const response = responseQueue[id]
  delete responseQueue[id]
  return response
}

/* Message Sending */

export const postMessage = (message: Message) => {
  // @ts-ignore
  if (window && window.ReactNativeWebView) {
    // @ts-ignore
    window.ReactNativeWebView.postMessage(JSON.stringify(message))
  }
}

/* Entry Point */

export class NativeMobileMessage {
  public type: MessageType
  public payload: object
  private id: string

  constructor(type: MessageType, message: object = {}) {
    this.type = type
    this.payload = message
    this.id = uuid()
  }

  public send() {
    postMessage({
      type: this.type,
      id: this.id,
      ...this.payload
    })
  }

  public async receive() {
    const response = await getResponse(this.id)
    return response
  }
}
