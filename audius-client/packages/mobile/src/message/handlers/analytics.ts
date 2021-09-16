import { track, screen, identify } from '../../utils/analytics'
import { Identify, Track, Screen } from '../../types/analytics'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.ANALYTICS_IDENTIFY]: async ({ message }) => {
    await identify(message as Identify)
  },
  [MessageType.ANALYTICS_TRACK]: async ({ message }) => {
    await track(message as Track)
  },
  [MessageType.ANALYTICS_SCREEN]: async ({ message }) => {
    await screen(message as Screen)
  }
}
