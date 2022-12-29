import type { SetThemeAction, SetSystemAppearanceAction } from '@audius/common'
import { themeSelectors, themeActions } from '@audius/common'
import { takeEvery, select, call } from 'typed-redux-saga'

import { THEME_STORAGE_KEY } from 'app/constants/storage-keys'
import { localStorage } from 'app/services/local-storage'
import { updateStatusBarTheme } from 'app/utils/theme'
const { setTheme, setSystemAppearance } = themeActions
const { getSystemAppearance, getTheme } = themeSelectors

function* setThemeAsync(action: SetThemeAction) {
  const systemAppearance = yield* select(getSystemAppearance)
  const { theme } = action.payload
  updateStatusBarTheme(theme, systemAppearance)

  yield* call([localStorage, 'setItem'], THEME_STORAGE_KEY, theme)
}

function* watchSetTheme() {
  yield* takeEvery(setTheme, setThemeAsync)
}

function* setSystemAppearanceAsync(action: SetSystemAppearanceAction) {
  const { systemAppearance } = action.payload
  const theme = yield* select(getTheme)
  updateStatusBarTheme(theme, systemAppearance)
}

function* watchSetSystemAppearance() {
  yield* takeEvery(setSystemAppearance, setSystemAppearanceAsync)
}

export default function sagas() {
  return [watchSetTheme, watchSetSystemAppearance]
}
