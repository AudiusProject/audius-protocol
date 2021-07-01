import { useEffect } from 'react'

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

export default useHotkeys
