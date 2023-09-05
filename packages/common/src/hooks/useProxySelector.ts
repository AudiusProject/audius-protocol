import type { DependencyList } from 'react'
import { useCallback } from 'react'

import memoize from 'proxy-memoize'
import { useSelector } from 'react-redux'

import type { CommonState } from '../store/commonStore'

const createProxySelectorHook = <TState extends object = any>() => {
  const useProxySelector = <TReturnType>(
    fn: (state: TState) => TReturnType,
    deps: DependencyList
  ): TReturnType => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useSelector(useCallback(memoize(fn), deps))
  }
  return useProxySelector
}

export const useProxySelector = createProxySelectorHook<CommonState>()
