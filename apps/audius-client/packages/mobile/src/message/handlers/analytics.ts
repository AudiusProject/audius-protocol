import type { Identify, Track, Screen } from 'app/types/analytics'
import { track, screen, identify } from 'app/utils/analytics'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

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
