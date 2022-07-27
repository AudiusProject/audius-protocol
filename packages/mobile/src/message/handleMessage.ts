import type { Theme } from '@audius/common'
import { Platform } from 'react-native'
import type { Dispatch } from 'redux'

import type { AnalyticsMessage } from '../types/analytics'

import { messageHandlers as analytics } from './handlers/analytics'
import { messageHandlers as android } from './handlers/android'
import { messageHandlers as audio } from './handlers/audio'
import { messageHandlers as commonState } from './handlers/commonState'
import { messageHandlers as download } from './handlers/download'
import { messageHandlers as haptics } from './handlers/haptics'
import { messageHandlers as lifecycle } from './handlers/lifecycle'
import { messageHandlers as linking } from './handlers/linking'
import { messageHandlers as logging } from './handlers/logging'
import { messageHandlers as notification } from './handlers/notification'
import { messageHandlers as oauth } from './handlers/oauth'
import { messageHandlers as search } from './handlers/search'
import { messageHandlers as signon } from './handlers/signon'
import { messageHandlers as theme } from './handlers/theme'
import { messageHandlers as tipping } from './handlers/tipping'
import { messageHandlers as version } from './handlers/version'
import type { Message, MessageHandlers } from './types'

const isIos = Platform.OS === 'ios'

const messageHandlers: Partial<MessageHandlers> = {
  ...analytics,
  ...(isIos ? {} : android),
  ...audio,
  ...commonState,
  ...download,
  ...haptics,
  ...lifecycle,
  ...linking,
  ...logging,
  ...notification,
  ...oauth,
  ...search,
  ...signon,
  ...theme,
  ...version,
  ...tipping
}

export const handleMessage = async (
  message: Message | AnalyticsMessage,
  dispatch: Dispatch,
  postMessage: (message: Message) => void,
  reload: () => void,
  setTheme: (theme: Theme) => void
) => {
  const handler = (messageHandlers as any)[message.type]
  if (handler) {
    handler({ message, dispatch, postMessage, reload, setTheme })
  } else {
    // Ignore warning for android messages on ios
    if (message.type in android && isIos) {
      return
    }

    console.warn('No handler defined for message type: ', message.type)
  }
}
