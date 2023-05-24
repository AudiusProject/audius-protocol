import { useEffect, useState } from 'react'

import { isEqual } from 'lodash'
import { useCustomCompareEffect } from 'react-use'

import { Status } from 'models/Status'

import { QueryHookResults } from '../types'

export const usePaginatedQuery = <
  Data extends [],
  ArgsType extends { limit: number; offset: number },
  HookType extends (args: ArgsType) => QueryHookResults<Data>
>(
  useQueryHook: HookType,
  baseArgs: Exclude<ArgsType, 'limit' | 'offset'>,
  pageSize: number
) => {
  const [page, setPage] = useState(0)
  const args = { ...baseArgs, limit: pageSize, offset: page * pageSize }
  const result = useQueryHook(args)
  return {
    ...result,
    loadMore: () => setPage(page + 1),
    hasMore:
      result.status === Status.IDLE ||
      (!result.data && result.status === Status.LOADING) ||
      result.data?.length === pageSize
  }
}

export const useAllPaginatedQuery = <
  Data,
  ArgsType extends { limit: number; offset: number },
  HookType extends (args: ArgsType) => QueryHookResults<Data[]>
>(
  useQueryHook: HookType,
  baseArgs: Omit<ArgsType, 'limit' | 'offset'>,
  pageSize: number
) => {
  const [page, setPage] = useState(0)
  const [allData, setAllData] = useState<Data[]>([])
  const args = {
    ...baseArgs,
    limit: pageSize,
    offset: page * pageSize
  } as ArgsType
  const result = useQueryHook(args)
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
