import { useCallback, useContext, useEffect, useState } from 'react'

import { ResponseError } from '@audius/sdk'
import { CaseReducerActions, createSlice } from '@reduxjs/toolkit'
import retry from 'async-retry'
import { produce } from 'immer'
import { isEqual, mapValues } from 'lodash'
import { denormalize, normalize } from 'normalizr'
import { useDispatch, useSelector } from 'react-redux'
import { useCustomCompareEffect, useDebounce } from 'react-use'
import { Dispatch } from 'redux'
import { call, select } from 'typed-redux-saga'

import {
  Collection,
  CollectionMetadata,
  UserCollectionMetadata
} from '~/models/Collection'
import { ErrorLevel } from '~/models/ErrorReporting'
import { Kind } from '~/models/Kind'
import { PaginatedStatus, Status } from '~/models/Status'
import { User, UserMetadata } from '~/models/User'
import { getCollection } from '~/store/cache/collections/selectors'
import { reformatCollection } from '~/store/cache/collections/utils/reformatCollection'
import { getTrack } from '~/store/cache/tracks/selectors'
import { reformatUser } from '~/store/cache/users/utils'
import { CommonState } from '~/store/reducers'
import { getErrorMessage } from '~/utils/error'
import { waitForValue } from '~/utils/sagaHelpers'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { Track } from '../models/Track'
import * as accountSelectors from '../store/account/selectors'
import * as cacheActions from '../store/cache/actions'
import * as cacheSelectors from '../store/cache/selectors'

import {
  AudiusQueryContext,
  AudiusQueryContextType,
  getAudiusQueryContext
} from './AudiusQueryContext'
import { createRequestBatcher } from './createRequestBatcher'
import { RemoteDataNotFoundError } from './errors'
import { apiResponseSchema } from './schema'
import {
  Api,
  ApiState,
  DefaultEndpointDefinitions,
  EndpointConfig,
  FetchErrorAction,
  FetchLoadingAction,
  FetchSucceededAction,
  QueryHookOptions,
  PerEndpointState,
  PerKeyState,
  SliceConfig,
  QueryHookResults,
  FetchResetAction,
  RetryConfig,
  MutationHookResults,
  PaginatedQueryHookOptions,
  PaginatedQueryArgs,
  PaginatedQueryHookResults
} from './types'
import { capitalize, getKeyFromFetchArgs, selectCommonEntityMap } from './utils'

const { getUserId } = accountSelectors

type ForceType = 'force' | 'forcing' | false

type Entity = Collection | Track | User

const { addEntries } = cacheActions

const defaultRetryConfig: RetryConfig = {
  retries: 2
}

const isNonRetryableError = (e: unknown) => {
  // Don't retry user-level errors other than 404
  if (e instanceof ResponseError) {
    const { status } = e.response
    return status >= 400 && status < 500 && status !== 404
  }
  return false
}

export const createApi = <
  EndpointDefinitions extends DefaultEndpointDefinitions
>({
  reducerPath,
  endpoints
}: {
  reducerPath: string
  endpoints: EndpointDefinitions
}) => {
  const api = {
    reducerPath,
    hooks: {},
    fetch: {},
    fetchSaga: {}
  } as unknown as Api<EndpointDefinitions>

  const sliceConfig: SliceConfig = {
    name: reducerPath,
    initialState: {},
    reducers: {}
  }

  for (const endpointName of Object.keys(endpoints)) {
    addEndpointToSlice(sliceConfig, endpointName)
  }

  const slice = createSlice<ApiState, any, any>(sliceConfig)

  for (const [endpointName, endpoint] of Object.entries(endpoints)) {
    buildEndpointHooks(api, endpointName, endpoint, slice.actions, reducerPath)
  }

  api.reducer = slice.reducer
  api.actions = slice.actions
  api.util = {
    updateQueryData:
      (endpointName, fetchArgs, updateRecipe) =>
      (dispatch: Dispatch, getState: () => any) => {
        const key = getKeyFromFetchArgs(fetchArgs)
        // New endpoint state is used whenever updateQueryData is called before the endpoint being updated has had a chance to be called
        const newEndpointState = { status: Status.SUCCESS, normalizedData: {} }
        const endpointState =
          getState().api[reducerPath][endpointName][key] || newEndpointState
        const newState = produce(endpointState.normalizedData, updateRecipe)
        const updateAction =
          slice.actions[`fetch${capitalize(endpointName as string)}Succeeded`]
        if (updateAction) {
          dispatch(updateAction({ fetchArgs, normalizedData: newState }))
        }
      },
    reset: (endpointName) => (dispatch: Dispatch) => {
      const resetAction =
        slice.actions[`reset${capitalize(endpointName as string)}`]
      if (resetAction) {
        dispatch(resetAction())
      }
    }
  }

  return api
}

const addEndpointToSlice = <NormalizedData>(
  sliceConfig: SliceConfig,
  endpointName: string
) => {
  const initState: PerKeyState<NormalizedData> = {
    status: Status.IDLE
  }
  sliceConfig.initialState[endpointName] = {}
  sliceConfig.reducers = {
    ...sliceConfig.reducers,
    [`fetch${capitalize(endpointName)}Loading`]: (
      state: ApiState,
      action: FetchLoadingAction
    ) => {
      const { fetchArgs } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...initState, ...state[endpointName][key] }
      scopedState.status = Status.LOADING
      state[endpointName][key] = scopedState
    },
    [`fetch${capitalize(endpointName)}Error`]: (
      state: ApiState,
      action: FetchErrorAction
    ) => {
      const { fetchArgs, errorMessage } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...initState, ...state[endpointName][key] }
      scopedState.status = Status.ERROR
      scopedState.errorMessage = errorMessage
      state[endpointName][key] = scopedState
    },
    [`fetch${capitalize(endpointName)}Succeeded`]: (
      state: ApiState,
      action: FetchSucceededAction
    ) => {
      const { fetchArgs, normalizedData } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...initState, ...state[endpointName][key] }
      scopedState.status = Status.SUCCESS
      scopedState.normalizedData = normalizedData
      state[endpointName][key] = scopedState
    },
    [`reset${capitalize(endpointName)}`]: (
      state: ApiState,
      _action: FetchResetAction
    ) => {
      state[endpointName] = {}
    }
  }
}

// Check the legacy entity cache for results before calling audius-query fetch
const useQueryState = <Args, Data>(
  fetchArgs: Nullable<Args>,
  reducerPath: string,
  endpointName: string,
  endpoint: EndpointConfig<Args, Data>
): Nullable<PerKeyState<any> & { isInitialValue?: boolean }> => {
  return useSelector((state: CommonState) => {
    if (!state.api[reducerPath]) {
      throw new Error(
        `State for ${reducerPath} is undefined - did you forget to register the reducer in @audius/common/src/api/reducers.ts?`
      )
    }

    const endpointState: PerEndpointState<any> =
      state.api[reducerPath][endpointName]

    if (!fetchArgs) return endpointState.default
    const key = getKeyFromFetchArgs(fetchArgs)

    // Retrieve data from cache if lookup args provided
    if (key && !endpointState[key]) {
      if (
        !(
          endpoint.options?.idArgKey ||
          endpoint.options?.idListArgKey ||
          endpoint.options?.permalinkArgKey
        ) ||
        !endpoint.options?.kind ||
        !endpoint.options?.schemaKey
      )
        return null
      const { kind, idArgKey, idListArgKey, permalinkArgKey, schemaKey } =
        endpoint.options

      let cachedData: Nullable<Entity | number[]> = null
      if (idArgKey || permalinkArgKey || idListArgKey) {
        const fetchArgsRecord = fetchArgs as Record<string, any>
        if (idArgKey && fetchArgsRecord[idArgKey]) {
          const idAsNumber =
            typeof fetchArgsRecord[idArgKey] === 'number'
              ? fetchArgsRecord[idArgKey]
              : parseInt(fetchArgsRecord[idArgKey])
          cachedData = cacheSelectors.getEntry(state, {
            kind,
            id: idAsNumber
          })
        } else if (permalinkArgKey && fetchArgsRecord[permalinkArgKey]) {
          if (kind === Kind.TRACKS) {
            cachedData = getTrack(state, {
              permalink: fetchArgsRecord[permalinkArgKey]
            })
          } else if (kind === Kind.COLLECTIONS) {
            cachedData = getCollection(state, {
              permalink: fetchArgsRecord[permalinkArgKey]
            })
          }
        } else if (idListArgKey && fetchArgsRecord[idListArgKey]) {
          const idsAsNumbers: number[] = fetchArgsRecord[idListArgKey].map(
            (id: string | number) =>
              typeof id === 'number' ? id : parseInt(id)
          )
          const allEntities = mapValues(
            cacheSelectors.getCache(state, { kind }).entries,
            'metadata'
          )
          const entityHits = idsAsNumbers
            .map((id) => allEntities[id])
            .filter(removeNullable)
          if (entityHits.length === idsAsNumbers.length) {
            cachedData = entityHits
          }
        }
      }

      // cache hit
      if (cachedData) {
        const { result } = normalize(
          schemaKey ? { [schemaKey]: cachedData } : cachedData,
          apiResponseSchema
        )

        return {
          normalizedData: result,
          status: Status.SUCCESS,
          isInitialValue: true,
          errorMessage: undefined
        }
      }
    }

    return endpointState[key]
  }, isEqual)
}

const createCacheDataSelector =
  <Args, Data>(
    endpoint: EndpointConfig<Args, Data>,
    normalizedData: any,
    hookOptions?: QueryHookOptions
  ) =>
  (state: CommonState) => {
    if (hookOptions?.shallow && !endpoint.options.kind) return normalizedData
    const entityMap = selectCommonEntityMap(
      state,
      endpoint.options.kind,
      hookOptions?.shallow
    )
    if (
      endpoint.options.schemaKey ||
      (typeof normalizedData === 'object' && !Array.isArray(normalizedData))
    ) {
      return denormalize(normalizedData, apiResponseSchema, entityMap) as Data
    }
    return normalizedData
  }

// Rehydrate local normalizedData using entities from global normalized cache
const useCacheData = <Args, Data>(
  endpoint: EndpointConfig<Args, Data>,
  normalizedData: any,
  hookOptions?: QueryHookOptions
) => {
  return useSelector(
    createCacheDataSelector(endpoint, normalizedData, hookOptions),
    isEqual
  )
}

const requestBatcher = createRequestBatcher()

const fetchData = async <Args, Data>(
  fetchArgs: Args,
  endpointName: string,
  endpoint: EndpointConfig<Args, Data>,
  actions: CaseReducerActions<any>,
  context: AudiusQueryContextType,
  force?: ForceType,
  setForce?: (force: ForceType) => void,
  currentUserId?: Nullable<number>
) => {
  const { dispatch } = context
  try {
    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Loading`]({
        fetchArgs
      }) as FetchLoadingAction
    )

    const onQueryStartedData = await endpoint.onQueryStarted?.(fetchArgs, {
      dispatch
    })

    // Batch the request if `fetchBatch` is defined
    const fetch = endpoint.fetchBatch
      ? requestBatcher.fetch(endpointName, endpoint)
      : endpoint.fetch

    // If endpoint config specifies retries wrap the fetch
    // and return a single error at the end if all retries fail
    const apiData = endpoint.options.retry
      ? await retry(
          async (bail) => {
            try {
              return fetch(fetchArgs, context, onQueryStartedData)
            } catch (e) {
              if (isNonRetryableError(e)) {
                bail(new Error(`Non-retryable error: ${e}`))
              }
              return null
            }
          },
          { ...defaultRetryConfig, ...endpoint.options.retryConfig }
        )
      : await fetch(fetchArgs, context, onQueryStartedData)

    if (apiData === null || apiData === undefined) {
      if (force && setForce) {
        setForce(false)
      }
      throw new RemoteDataNotFoundError('Remote data not found')
    }

    let data: Data

    if (
      endpoint.options.schemaKey ||
      (typeof apiData === 'object' && !Array.isArray(apiData))
    ) {
      const { entities, result } = normalize(
        endpoint.options.schemaKey
          ? { [endpoint.options.schemaKey]: apiData }
          : apiData,
        apiResponseSchema
      )

      // Format entities before adding to cache
      entities[Kind.USERS] = mapValues(
        entities[Kind.USERS] ?? [],
        (user: UserMetadata) => reformatUser(user)
      )

      // Hack alert: We can't overwrite the current user, since it contains
      // special account data. Once this is removed from user cache we can
      // remove this line.
      if (force && currentUserId) {
        delete entities[Kind.USERS][currentUserId]
      }

      entities[Kind.COLLECTIONS] = mapValues(
        entities[Kind.COLLECTIONS] ?? [],
        (collection: CollectionMetadata | UserCollectionMetadata) =>
          reformatCollection({
            collection,
            omitUser: false
          })
      )
      dispatch(addEntries(entities, !!force))
      data = result
    } else {
      data = apiData
    }

    if (force && setForce) {
      setForce(false)
    }

    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Succeeded`]({
        fetchArgs,
        normalizedData: data
      }) as FetchSucceededAction
    )

    endpoint.onQuerySuccess?.(data, fetchArgs, { dispatch }, onQueryStartedData)
    return apiData
  } catch (e) {
    if (!(e instanceof RemoteDataNotFoundError)) {
      context.reportToSentry({
        error: e as Error,
        level: ErrorLevel.Error,
        additionalInfo: { fetchArgs, endpoint },
        name: `${
          endpoint.options?.type === 'mutation' ? 'Mutate' : 'Query'
        } ${capitalize(endpointName)} error`
      })
    }
    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Error`]({
        fetchArgs,
        errorMessage: getErrorMessage(e)
      }) as FetchErrorAction
    )
    return undefined
  }
}

const buildEndpointHooks = <
  EndpointDefinitions extends DefaultEndpointDefinitions,
  Args,
  Data
>(
  api: Api<EndpointDefinitions>,
  endpointName: keyof EndpointDefinitions & string,
  endpoint: EndpointConfig<Args, Data>,
  actions: CaseReducerActions<any>,
  reducerPath: string
) => {
  // Hook to be returned as use<EndpointName>
  const useQuery = (
    fetchArgs: Args,
    hookOptions?: QueryHookOptions
  ): QueryHookResults<Data> => {
    const dispatch = useDispatch()
    const [force, setForce] = useState<ForceType>(
      hookOptions?.force ? 'force' : false
    )
    const currentUserId = useSelector(getUserId)
    const queryState = useQueryState(
      fetchArgs,
      reducerPath,
      endpointName,
      endpoint
    )

    // If `force`, ignore queryState and force a fetch
    const state = force
      ? {
          normalizedData: null,
          status: force === 'forcing' ? Status.LOADING : Status.IDLE
        }
      : queryState

    const { normalizedData, status, errorMessage, isInitialValue } = state ?? {
      normalizedData: null,
      status: Status.IDLE
    }

    let cachedData = useCacheData(endpoint, normalizedData, hookOptions)

    const context = useContext(AudiusQueryContext)

    const fetchWrapped = useCallback(async () => {
      if (!context) return
      if ([Status.LOADING, Status.ERROR, Status.SUCCESS].includes(status))
        return
      if (hookOptions?.disabled) return
      if (force === 'forcing') return

      if (force === 'force') {
        setForce('forcing')
      }
      fetchData(
        fetchArgs,
        endpointName,
        endpoint,
        actions,
        context,
        force,
        setForce,
        currentUserId
      )
    }, [
      context,
      status,
      hookOptions?.disabled,
      force,
      fetchArgs,
      currentUserId
    ])

    useDebounce(
      () => {
        if (isInitialValue) {
          dispatch(
            // @ts-ignore
            actions[`fetch${capitalize(endpointName)}Succeeded`]({
              fetchArgs,
              normalizedData
            }) as FetchSucceededAction
          )
        }

        fetchWrapped()
      },
      hookOptions?.debounce ?? 0,
      [isInitialValue, dispatch, fetchArgs, normalizedData, fetchWrapped]
    )

    if (endpoint.options?.schemaKey) {
      cachedData = cachedData?.[endpoint.options?.schemaKey]
    }

    return {
      data: cachedData,
      status,
      errorMessage,
      forceRefresh: fetchWrapped
    }
  }

  const usePaginatedQuery = <Data extends [], ArgsType extends Args>(
    baseArgs: Omit<ArgsType, 'limit' | 'offset'>,
    options: PaginatedQueryHookOptions
  ): PaginatedQueryHookResults<Data> => {
    const dispatch = useDispatch()
    const {
      pageSize = 5,
      startOffset = 0,
      singlePageData,
      ...queryHookOptions
    } = options
    const [forceLoad, setForceLoad] = useState(false)
    const [page, setPage] = useState(0)
    const [status, setStatus] = useState<Status | PaginatedStatus>(Status.IDLE)

    // Resets current page and loading state, but the data is still held in store (which means cache hits will still return as expected)
    // This is triggered below when the args or page size changes
    const reset = useCallback(
      (hardReset?: boolean) => {
        setPage(0)
        setStatus(Status.IDLE)

        // If requesting a hard refresh we also reset the cached data in the store
        if (hardReset) {
          // @ts-ignore - Unclear whats wrong with the type here
          dispatch(actions[`reset${capitalize(endpointName)}`]())
        }
      },
      [dispatch]
    )

    // Should reset if args change - (soft reset - leaves all cached data intact)
    useCustomCompareEffect(reset, [baseArgs], isEqual)

    const args = {
      ...baseArgs,
      limit: pageSize,
      offset: startOffset + page * pageSize
    } as ArgsType & PaginatedQueryArgs

    const allPageData = useSelector((state: CommonState) => {
      // If in single page mode we only return the current page of data (no aggregation)
      if (singlePageData) {
        return (
          state?.api?.[reducerPath]?.[endpointName]?.[getKeyFromFetchArgs(args)]
            ?.normalizedData ?? []
        )
      }

      // By default, select data for every page up to the current page and aggregate the results
      let pageAccumulator: Data[] = []

      for (let i = 0; i <= page; i++) {
        const key = getKeyFromFetchArgs({
          ...args,
          offset: startOffset + i * pageSize
        })
        const normalizedPageData =
          state?.api?.[reducerPath]?.[endpointName]?.[key]?.normalizedData ?? []
        if (normalizedPageData) {
          // If an endpoint is paginated it "should" be in an array format but in case it's not we just append it to the accumulator
          if (!Array.isArray(normalizedPageData)) {
            pageAccumulator.push(normalizedPageData)
          } else {
            pageAccumulator = [...pageAccumulator, ...normalizedPageData]
          }
        }
      }
      return pageAccumulator
    })

    // Since this is a paginated query we know that the results will be in an array
    // Call the useQuery hook to trigger cache checks and/or fetches
    const result = useQuery(args, queryHookOptions) as QueryHookResults<Data[]>

    // If forceLoad is set, force a data refresh on every render
    useEffect(() => {
      if (forceLoad) {
        result.forceRefresh()
        setForceLoad(false)
      }
    }, [result, forceLoad])

    // Track status of the latest page fetches
    useEffect(() => {
      if (
        !(
          // If the status was set to LOADING_MORE, we've requested a new page; in which case we don't want to reset the status to IDLE or LOADING
          (
            status === PaginatedStatus.LOADING_MORE &&
            (result.status === Status.LOADING || result.status === Status.IDLE)
          )
        ) &&
        status !== result.status // redudant changes
      ) {
        setStatus(result.status)
      }
    }, [result.status, status])

    const notError = result.status !== Status.ERROR
    const stillLoadingCurrentPage =
      status === PaginatedStatus.LOADING_MORE ||
      result.status === Status.LOADING
    const notStarted = result.status === Status.IDLE && allPageData.length === 0
    const hasNotFetched = !result.data && result.status !== Status.SUCCESS
    // If fetchedFullPreviousPage is less than the pageSize we can infer that there are no more pages to fetch
    const fetchedFullPreviousPage = result.data?.length === pageSize

    const hasMore =
      notError && (notStarted || hasNotFetched || fetchedFullPreviousPage)

    // Callback to increment the page state which will trigger new more data queries
    const loadMore = useCallback(() => {
      // If we're still loading a page OR there isn't any more data to load nothing should happen here yet
      if (stillLoadingCurrentPage || !hasMore) {
        return
      }
      setStatus(PaginatedStatus.LOADING_MORE)
      setPage((page) => page + 1)
    }, [stillLoadingCurrentPage, hasMore])

    return {
      ...result,
      status,
      data: allPageData,
      reset,
      loadMore,
      hasMore
    }
  }

  // Hook to be returned as use<EndpointName>
  const useMutation = (
    hookOptions?: QueryHookOptions
  ): MutationHookResults<Args, Data> => {
    const [fetchArgs, setFetchArgs] = useState<Args | null>(null)
    const key = getKeyFromFetchArgs(fetchArgs)
    const queryState = useQueryState(
      fetchArgs,
      reducerPath,
      endpointName,
      endpoint
    )

    const { normalizedData, status, errorMessage } = queryState ?? {
      normalizedData: null,
      status: Status.IDLE
    }

    let cachedData = useCacheData(endpoint, normalizedData, hookOptions)
    const context = useContext(AudiusQueryContext)

    const fetchWrapped = useCallback(
      async (newFetchArgs: any) => {
        const newKey = getKeyFromFetchArgs(newFetchArgs)

        if (key === newKey) {
          return
        } else {
          setFetchArgs(newFetchArgs)
        }

        if (!context) return
        if (hookOptions?.disabled) return

        fetchData(newFetchArgs, endpointName, endpoint, actions, context)
      },
      [key, context, hookOptions?.disabled]
    )

    if (endpoint.options?.schemaKey) {
      cachedData = cachedData?.[endpoint.options?.schemaKey]
    }

    return [
      fetchWrapped,
      {
        data: cachedData,
        status,
        errorMessage
      }
    ]
  }

  /**
   * This is not actually a saga, but a function that can be called from a saga
   * It supports the same caching logic as the useQuery hook and will skip
   * making a request if cache data already exists or a request is in flight
   */
  function* fetchSaga(fetchArgs: Args, force?: boolean) {
    const context = yield* call(getAudiusQueryContext)

    if (!force) {
      const key = getKeyFromFetchArgs(fetchArgs)

      const getEndpointKeyState = (state: CommonState) =>
        state.api[reducerPath][endpointName][key] ?? {}
      const getEndpointKeyStatus = (state: CommonState) =>
        getEndpointKeyState(state).status

      const status = yield* select(getEndpointKeyStatus)

      if ([Status.LOADING, Status.ERROR, Status.SUCCESS].includes(status)) {
        // If a request is already in flight, wait for it to finish
        yield* call(
          waitForValue,
          getEndpointKeyStatus,
          {},
          (s: Status) => s !== Status.LOADING
        )

        const endpointState = yield* select(getEndpointKeyState)
        const { normalizedData } = endpointState

        const cacheData = yield* select(
          createCacheDataSelector(endpoint, normalizedData)
        )
        return endpoint.options?.schemaKey
          ? cacheData[endpoint.options.schemaKey]
          : cacheData
      }
    }

    return yield* call(
      fetchData as any,
      fetchArgs,
      endpointName,
      endpoint,
      actions,
      context,
      force
    )
  }

  api.fetchSaga[endpointName] = fetchSaga

  api.fetch[endpointName] = (
    fetchArgs: Args,
    context: AudiusQueryContextType
  ) => fetchData(fetchArgs, endpointName, endpoint, actions, context)

  let endpointHook
  if (endpoint.options.type === 'mutation') {
    endpointHook = useMutation
  } else if (endpoint.options.type === 'paginatedQuery') {
    endpointHook = usePaginatedQuery
  } else {
    endpointHook = useQuery
  }
  api.hooks[`use${capitalize(endpointName)}`] = endpointHook
}
