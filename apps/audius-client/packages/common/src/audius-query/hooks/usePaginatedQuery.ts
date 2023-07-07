import { useCallback, useEffect, useState } from 'react'

import { isEqual } from 'lodash'
import { useCustomCompareEffect } from 'react-use'

import { Status } from 'models/Status'

import { QueryHookOptions, QueryHookResults } from '../types'

export const usePaginatedQuery = <
  Data,
  ArgsType extends { limit: number; offset: number }
>(
  useQueryHook: (
    args: ArgsType,
    options?: QueryHookOptions
  ) => QueryHookResults<Data[]>,
  baseArgs: Omit<ArgsType, 'limit' | 'offset'>,
  options: { pageSize: number } & QueryHookOptions
) => {
  const { pageSize, ...queryHookOptions } = options
  const { disabled } = queryHookOptions
  const [page, setPage] = useState(0)
  const args = {
    ...baseArgs,
    limit: pageSize,
    offset: page * pageSize
  } as ArgsType
  const result = useQueryHook(args, queryHookOptions)

  const loadMore = useCallback(() => {
    if (!disabled) {
      setPage(page + 1)
    }
  }, [disabled, page])

  return {
    ...result,
    loadMore,
    hasMore:
      result.status === Status.IDLE ||
      (!result.data && result.status === Status.LOADING) ||
      result.data?.length === pageSize
  }
}

export const useAllPaginatedQuery = <
  Data,
  ArgsType extends { limit: number; offset: number }
>(
  useQueryHook: (
    args: ArgsType,
    options?: QueryHookOptions
  ) => QueryHookResults<Data[]>,
  baseArgs: Omit<ArgsType, 'limit' | 'offset'>,
  options: { pageSize: number } & QueryHookOptions
) => {
  const { pageSize, ...queryHookOptions } = options
  const [page, setPage] = useState(0)
  const [allData, setAllData] = useState<Data[]>([])
  const args = {
    ...baseArgs,
    limit: pageSize,
    offset: page * pageSize
  } as ArgsType
  const result = useQueryHook(args, queryHookOptions)
  useEffect(() => {
    if (result.status !== Status.SUCCESS) return
    setAllData((allData) => [...allData, ...result.data])
  }, [result.status, result.data])

  useCustomCompareEffect(
    () => {
      setAllData([])
    },
    [baseArgs],
    isEqual
  )

  return {
    ...result,
    // TODO: add another status for reloading
    status: allData?.length > 0 ? Status.SUCCESS : result.status,
    data: allData,
    loadMore: () => setPage(page + 1),
    hasMore:
      result.status === Status.IDLE ||
      (!result.data && result.status === Status.LOADING) ||
      result.data?.length === pageSize
  }
}
