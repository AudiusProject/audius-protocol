import { Theme, themeActions, actionChannelDispatcher } from '@audius/common'
import { PayloadAction } from '@reduxjs/toolkit'
import { eventChannel } from 'redux-saga'
import { spawn, takeEvery } from 'redux-saga/effects'

import { setTheme, PREFERS_DARK_MEDIA_QUERY } from 'utils/theme/theme'
const { setTheme: setThemeAction } = themeActions

// `window.matchMedia` can be undefined in some environments (testing and outdated browsers).
const mql =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(PREFERS_DARK_MEDIA_QUERY)
    : null
let mqlListener: EventListener

function* setThemeAsync(action: PayloadAction<{ theme: Theme }>) {
  const { theme } = action.payload
  setTheme(theme)

  // If the user switches to auto, add a media query listener that
  // updates their theme setting again if the OS theme preference changes
  if (mql && mqlListener) mql.removeListener(mqlListener)
  if (theme === Theme.AUTO && mql) {
    const channel = eventChannel((emitter) => {
      mqlListener = () => {
        emitter(setThemeAction({ theme: Theme.AUTO }))
      }
      mql.addListener(mqlListener)
      return () => {}
    })
    yield spawn(actionChannelDispatcher, channel)
  }
}

export function* watchSetTheme() {
  yield takeEvery(setThemeAction, setThemeAsync)
}

export default function sagas() {
  return [watchSetTheme]
}
