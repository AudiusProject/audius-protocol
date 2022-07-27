import {
  getInitialDarkModePreference,
  getPrefersDarkModeChange
} from 'app/theme'
import { handleThemeChange } from 'app/utils/theme'

import type { MessageHandlers } from '../types'
import { MessageType } from '../types'

let sentInitialTheme = false

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.THEME_CHANGE]: ({ message, setTheme }) => {
    setTheme(message.theme)
    handleThemeChange(message.theme)
  },
  [MessageType.PREFERS_COLOR_SCHEME]: async ({ message, postMessage }) => {
    let prefers
    if (!sentInitialTheme) {
      prefers = getInitialDarkModePreference()
      sentInitialTheme = true
    } else {
      prefers = await getPrefersDarkModeChange()
    }
    postMessage({
      type: message.type,
      id: message.id,
      prefersDarkMode: prefers
    })
  }
}
