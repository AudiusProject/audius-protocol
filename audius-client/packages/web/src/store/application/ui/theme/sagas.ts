import {
  Theme,
  themeActions,
  ThemeActions,
  actionChannelDispatcher
} from '@audius/common'
import { eventChannel } from 'redux-saga'
import { put, call, spawn, takeEvery } from 'redux-saga/effects'

import { PrefersColorSchemeMessage } from 'services/native-mobile-interface/android/theme'
import { ThemeChangeMessage } from 'services/native-mobile-interface/theme'
import { getIsIOS } from 'utils/browser'
import { setTheme, PREFERS_DARK_MEDIA_QUERY } from 'utils/theme/theme'
const { SET_THEME, setTheme: setThemeAction } = themeActions

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

// `window.matchMedia` can be undefined in some environments (testing and outdated browsers).
const mql = window.matchMedia
  ? window.matchMedia(PREFERS_DARK_MEDIA_QUERY)
  : null
let mqlListener: EventListener

const message = new PrefersColorSchemeMessage()
const doesPreferDark = async () => {
  message.send()
  const { prefersDarkMode } = await message.receive()
  // @ts-ignore
  window.prefersDarkMode = prefersDarkMode
  return prefersDarkMode
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
    if (NATIVE_MOBILE) {
      const message = new ThemeChangeMessage(theme)
      message.send()
    }

    // If the user switches to auto, add a media query listener that
    // updates their theme setting again if the OS theme preference changes
    if (mql && mqlListener) mql.removeListener(mqlListener)
    if (theme === Theme.AUTO && mql) {
      const channel = eventChannel((emitter) => {
        mqlListener = () => {
          emitter(setThemeAction(Theme.AUTO))
        }
        mql.addListener(mqlListener)
        return () => {}
      })
      yield spawn(actionChannelDispatcher, channel)
    }

    if (theme === Theme.AUTO && NATIVE_MOBILE && !getIsIOS()) {
      yield spawn(watchNativeTheme)
    }
  })
}

export default function sagas() {
  return [watchSetTheme]
}
