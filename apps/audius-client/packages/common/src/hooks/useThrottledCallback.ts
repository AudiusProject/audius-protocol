import type { DependencyList } from 'react'
import { useMemo } from 'react'

import { throttle } from 'lodash'

export const useThrottledCallback = <T extends (...args: any) => any>(
  callback: T,
  deps: DependencyList,
  wait: number
) => {
  return useMemo(
    () => throttle(callback, wait, { trailing: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wait, ...deps]
  )
}
