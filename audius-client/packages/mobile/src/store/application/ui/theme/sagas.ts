import type { ThemeActions } from '@audius/common'
import { Theme, themeActions } from '@audius/common'
import { Platform } from 'react-native'
import { put, call, spawn, takeEvery } from 'redux-saga/effects'
import { setTheme } from 'utils/theme/theme'

import {
  getInitialDarkModePreference,
  getPrefersDarkModeChange
} from 'app/theme'
const { SET_THEME, setTheme: setThemeAction } = themeActions

let setInitialTheme = false

const doesPreferDark = async () => {
  let prefersDark: boolean
  if (!setInitialTheme) {
    prefersDark = getInitialDarkModePreference()
    setInitialTheme = true
  } else {
    prefersDark = await getPrefersDarkModeChange()
  }
  return prefersDark
}

// Watches for changes in the native OS theme (only important on android) by
// dispatching a message request into the ether. If it comes back, we know
// the user has actually changed their theme.
function* watchNativeTheme() {
  while (true) {
    yield call(doesPreferDark)
    // Wait for a message (if any) to come back from the native layer
    yield put(setThemeAction(Theme.AUTO))
  }
}

export function* watchSetTheme() {
  yield takeEvery(SET_THEME, function* (action: ThemeActions) {
    const { theme } = action
    setTheme(theme)

    if (theme === Theme.AUTO && Platform.OS === 'android') {
      yield spawn(watchNativeTheme)
    }
  })
}

export default function sagas() {
  return [watchSetTheme]
}
