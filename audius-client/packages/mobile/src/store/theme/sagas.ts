import type { SystemAppearance } from '@audius/common'
import { themeSelectors, Theme, themeActions } from '@audius/common'
import type { PayloadAction } from '@reduxjs/toolkit'
import { eventEmitter, initialMode } from 'react-native-dark-mode'
import { put, call, spawn, takeEvery, select } from 'typed-redux-saga'

import { localStorage } from 'app/services/local-storage'
const { setTheme, setSystemAppearance } = themeActions
const { getSystemAppearance } = themeSelectors

const waitForSystemAppearanceChange = async () => {
  let listener

  const systemAppearance = await new Promise<SystemAppearance>((resolve) => {
    listener = (mode: SystemAppearance) => {
      resolve(mode)
    }
    eventEmitter.on('currentModeChanged', listener)
  })

  eventEmitter.removeListener('currentModeChanged', listener)

  return systemAppearance
}

function* watchSystemAppearanceChange() {
  while (true) {
    const systemAppearance = yield* select(getSystemAppearance)
    if (!systemAppearance) {
      yield* put(
        setSystemAppearance({
          systemAppearance: initialMode as SystemAppearance
        })
      )
    } else {
      const systemAppearance = yield* call(waitForSystemAppearanceChange)
      yield* put(setSystemAppearance({ systemAppearance }))
    }
  }
}

function* setThemeAsync(action: PayloadAction<{ theme: Theme }>) {
  const { theme } = action.payload

  yield* call([localStorage, 'setItem'], 'theme', theme)
}

function* watchSetTheme() {
  yield* takeEvery(setTheme, setThemeAsync)
}

export function* setupTheme() {
  const savedTheme = yield* call([localStorage, 'getItem'], 'theme')

  if (!savedTheme) {
    yield* put(setTheme({ theme: Theme.DEFAULT }))
  } else {
    yield* put(setTheme({ theme: savedTheme as Theme }))
  }

  yield* spawn(watchSystemAppearanceChange)
}

export default function sagas() {
  return [watchSetTheme]
}
