import * as themeActions from '../../store/theme/actions'
import { handleThemeChange } from '../../utils/theme'

import {
  getInitialDarkModePreference,
  getPrefersDarkModeChange
} from '../../theme'
import { MessageType, MessageHandlers } from '../types'

let sentInitialTheme = false

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.THEME_CHANGE]: ({ message, dispatch }) => {
    dispatch(themeActions.set(message.theme))
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
