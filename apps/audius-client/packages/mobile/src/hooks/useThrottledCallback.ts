import type { DependencyList } from 'react'
import { useMemo } from 'react'

import { throttle } from 'lodash'

export const useThrottledCallback = <T extends (...args: any) => any>(
  callback: T,
  wait: number,
  deps: DependencyList
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => throttle(callback, wait), [wait, ...deps])
}
