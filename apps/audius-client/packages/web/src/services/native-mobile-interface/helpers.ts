import { eventChannel } from 'redux-saga'
import { take, put } from 'typed-redux-saga/macro'

import { uuid } from 'common/utils/uid'
import { getIsIOS } from 'utils/browser'

import { Message, MessageType } from './types'

/* Message Receiving */

type ResponseQueue = {
  [id: string]: Message
}

// A persisted queue of responses received from sending requests
const responseQueue: ResponseQueue = {}
// @ts-ignore
window.responseQueue = responseQueue
const receiveMessage = (message: Message) => {
  // TODO verify source/origins
  if (message.id) {
    responseQueue[message.id] = message
  }
}

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

const SPAMMY_MESSAGES = new Set([MessageType.GET_POSITION])

export function* initInterface() {
  const globalWindow = getIsIOS() ? window : document
  const channel = eventChannel<Message>((emitter) => {
    // Attach messages to the window
    globalWindow.addEventListener('message', (data) => {
      try {
        // @ts-ignore
        emitter(JSON.parse(data.data))
      } catch (e) {
        // If the dapp is not running inside a react native wrapper
        // this can be incredibly noisy.
        // console.info(e)
      }
    })
    return () => {}
  })

  // Tell native that we have loaded the interface
  const message = new LoadedMessage()
  message.send()

  while (true) {
    const message = yield* take(channel)

    // Log it if it isn't spammy
    if (!SPAMMY_MESSAGES.has(message.type)) {
      console.debug(`Got native mobile message: ${JSON.stringify(message)}`)
    }

    if (message.isAction) {
      yield* put(message)
    }
    receiveMessage(message)
  }
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

class LoadedMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.LOADED, {})
  }
}
