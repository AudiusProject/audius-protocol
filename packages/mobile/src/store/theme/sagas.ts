import type { SetThemeAction } from '@audius/common/store'
import { themeActions } from '@audius/common/store'
import { takeEvery, call } from 'typed-redux-saga'

import { THEME_STORAGE_KEY } from 'app/constants/storage-keys'
import { localStorage } from 'app/services/local-storage'
const { setTheme } = themeActions

function* setThemeAsync(action: SetThemeAction) {
  const { theme } = action.payload
  yield* call([localStorage, 'setItem'], THEME_STORAGE_KEY, theme)
}

function* watchSetTheme() {
  yield* takeEvery(setTheme, setThemeAsync)
}

export default function sagas() {
  return [watchSetTheme]
}
