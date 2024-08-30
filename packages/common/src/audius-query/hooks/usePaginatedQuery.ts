import { useCallback, useEffect, useState } from 'react'

import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { useCustomCompareEffect } from 'react-use'

import { Status } from '~/models/Status'
import { CommonState } from '~/store'

import { QueryHookOptions, QueryHookResults } from '../types'
import { getKeyFromFetchArgs } from '../utils'

/**
 * @deprecated This hook is deprecated in favor of using the 'paginatedQuery' type inside the createApi() method. See comments.ts for an example.
 */
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
  const hasMore =
    result.status === Status.IDLE ||
    (!result.data && result.status === Status.LOADING) ||
    result.data?.length === pageSize

  const loadMore = useCallback(() => {
    if (!disabled || !hasMore) {
      setPage(page + 1)
    }
  }, [disabled, hasMore, page])

  return {
    ...result,
    loadMore,
    hasMore
  }
}

/**
 * @deprecated This hook is deprecated in favor of using the 'paginatedQuery' type inside the createApi() method. See comments.ts for an example.
 */
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
  const [loadingMore, setLoadingMore] = useState(false)
  const { pageSize, ...queryHookOptions } = options
  const [forceLoad, setForceLoad] = useState(false)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<Status>(Status.IDLE)
  const [allData, setAllData] = useState<Data[]>([])

  const reset = useCallback(() => {
    setAllData([])
    setPage(0)
    setLoadingMore(false)
  }, [])

  useCustomCompareEffect(reset, [baseArgs], isEqual)

  const args = {
    ...baseArgs,
    limit: pageSize,
    offset: page * pageSize
  } as ArgsType

  const result = useQueryHook(args, queryHookOptions)

  useEffect(() => {
    if (forceLoad) {
      result.forceRefresh()
      setForceLoad(false)
    }
  }, [result, forceLoad])

  useCustomCompareEffect(
    () => {
      setStatus(result.status)
      if (result.status === Status.ERROR) {
        setLoadingMore(false)
        return
      }
      if (result.status === Status.SUCCESS) {
        setAllData((allData) => [
          ...allData,
          ...(Array.isArray(result.data) ? result.data : [])
        ])
        setLoadingMore(false)
      }
    },
    [result.status, args],
    isEqual
  )

  const notError = result.status !== Status.ERROR
  const stillLoadingCurrentPage =
    loadingMore || result.status === Status.LOADING
  const notStarted = result.status === Status.IDLE && allData.length === 0
  const hasNotFetched = !result.data && result.status !== Status.SUCCESS
  const fetchedFullPreviousPage = result.data?.length === pageSize

  const hasMore =
    notError && (notStarted || hasNotFetched || fetchedFullPreviousPage)

  const loadMore = useCallback(() => {
    if (stillLoadingCurrentPage || !hasMore) {
      return
    }
    setLoadingMore(true)
    setPage(page + 1)
  }, [stillLoadingCurrentPage, hasMore, page])

  return {
    ...result,
    status: allData?.length > 0 ? Status.SUCCESS : status,
    data: allData,
    isLoadingMore: stillLoadingCurrentPage,
    reset,
    loadMore,
    hasMore
  }
}
