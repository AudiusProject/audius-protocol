import { useCallback, useState } from 'react'

import { useHotkeys } from '@audius/harmony'

import { env } from 'services/env'

const ENABLE_DEV_MODE_KEY = 'enable-dev-mode-01-21-2025'

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
