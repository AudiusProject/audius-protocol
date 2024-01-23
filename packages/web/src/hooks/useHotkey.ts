import { useCallback, useEffect, useState } from 'react'

import { env } from 'services/env'
import { setupHotkeys, removeHotkeys } from 'utils/hotkeyUtil'

enum Modifier {
  CMD = 0,
  CTRL = 1,
  SHIFT = 2,
  ALT = 3
}

type ModifierHandler = {
  cb: () => void
  or?: Modifier[]
  and?: Modifier[]
}

type Handler = () => void

type Mapping = {
  [key: number]: Handler | ModifierHandler
}

const useHotkeys = (mapping: Mapping) => {
  useEffect(() => {
    const hook = setupHotkeys(mapping)
    return () => {
      removeHotkeys(hook)
    }
  }, [mapping])
}

const ENABLE_DEV_MODE_KEY = 'enable-dev-mode'
export const useDevModeHotkey = (keyCode: number) => {
  const [isEnabled, setIsEnabled] = useState(false)

  const listener = useCallback(() => {
    if (
      env.ENVIRONMENT === 'production' &&
      (!window.localStorage ||
        !window.localStorage.getItem(ENABLE_DEV_MODE_KEY))
    )
      return
    setIsEnabled((e) => !e)
  }, [])

  useHotkeys({ [keyCode]: listener })

  return isEnabled
}

export default useHotkeys
