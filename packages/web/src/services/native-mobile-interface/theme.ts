import { Theme } from '@audius/common'

import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

/**
 * Notifies the Mobile Client that the theme has changed
 */
export class ThemeChangeMessage extends NativeMobileMessage {
  constructor(theme: Theme) {
    super(MessageType.THEME_CHANGE, { theme })
  }
}
