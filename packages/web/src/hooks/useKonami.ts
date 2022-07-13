import { useState, useEffect, useCallback } from 'react'

import useInstanceVar from 'common/hooks/useInstanceVar'

enum KonamiKey {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  B = 'B',
  A = 'A'
}

const KONAMI = [
  KonamiKey.UP,
  KonamiKey.UP,
  KonamiKey.DOWN,
  KonamiKey.DOWN,
  KonamiKey.LEFT,
  KonamiKey.RIGHT,
  KonamiKey.LEFT,
  KonamiKey.RIGHT,
  KonamiKey.B,
  KonamiKey.A
]

const keycodeMap: { [keyCode: number]: KonamiKey } = {
  37: KonamiKey.LEFT,
  38: KonamiKey.UP,
  39: KonamiKey.RIGHT,
  40: KonamiKey.DOWN,
  65: KonamiKey.A,
  66: KonamiKey.B
}

export const useKonami = () => {
  const [isKonami, setIsKonami] = useState(false)
  const [getRemainingCode, setRemainingCode] =
    useInstanceVar<KonamiKey[]>(KONAMI)

  const keydownListener = useCallback(
    ({ keyCode }: KeyboardEvent) => {
      if (isKonami) return
      const konamiKey = keycodeMap[keyCode]
      const remainingCode = getRemainingCode()
      if (konamiKey !== remainingCode[0]) {
        setRemainingCode(KONAMI)
        return
      }

      const newRemaining = remainingCode.slice(1)
      if (!newRemaining.length) {
        setIsKonami(true)
        return
      }
      setRemainingCode(newRemaining)
    },
    [getRemainingCode, isKonami, setRemainingCode]
  )

  useEffect(() => {
    window.addEventListener('keydown', keydownListener)
    return () => window.removeEventListener('keydown', keydownListener)
  }, [keydownListener])

  return { isKonami }
}
