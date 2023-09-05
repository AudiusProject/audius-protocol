import { useEffect } from 'react'

import { Mapping, setupHotkeys, removeHotkeys } from 'utils/hotkeyUtil'

export const useHotkeys = (mapping: Mapping) => {
  useEffect(() => {
    const hook = setupHotkeys(mapping)
    return () => {
      removeHotkeys(hook)
    }
  }, [mapping])
}
