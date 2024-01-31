import type { DependencyList } from 'react'
import { useCallback } from 'react'

import memoize from 'proxy-memoize'
import { useSelector } from 'react-redux'

import type { CommonState } from '../store/commonStore'

export const createProxySelectorHook = <TState extends object = any>() => {
  const useProxySelector = <TReturnType>(
    fn: (state: TState) => TReturnType,
    deps: DependencyList,
    equalityFn?: Parameters<typeof useSelector>[1]
  ): TReturnType => {
    // @ts-ignore
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useSelector(useCallback(memoize(fn), deps), equalityFn)
  }
  return useProxySelector
}

export const useProxySelector = createProxySelectorHook<CommonState>()
