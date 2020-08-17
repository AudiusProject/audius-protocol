import { MessageType } from './types'
import { NativeMobileMessage } from './helpers'

export class SetAnalyticsUser extends NativeMobileMessage {
  constructor(handle: string, traits?: Record<string, any>) {
    super(MessageType.ANALYTICS_IDENTIFY, { handle, traits })
  }
}

export class TrackAnalyticsEvent extends NativeMobileMessage {
  constructor(eventName: string, properties?: Record<string, any>) {
    super(MessageType.ANALYTICS_TRACK, { eventName, properties })
  }
}

export class ScreenAnalyticsEvent extends NativeMobileMessage {
  constructor(route: string, properties?: Record<string, any>) {
    super(MessageType.ANALYTICS_SCREEN, { route, properties })
  }
}
