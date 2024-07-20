import {
  MutableRefObject,
  useCallback,
  useContext,
  useRef,
  useState
} from 'react'

import { ResponseError } from '@audius/sdk'
import { CaseReducerActions, createSlice } from '@reduxjs/toolkit'
import retry from 'async-retry'
import { produce } from 'immer'
import { isEqual, mapValues } from 'lodash'
import { denormalize, normalize } from 'normalizr'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'
import { Dispatch } from 'redux'

import {
  Collection,
  CollectionMetadata,
  UserCollectionMetadata
} from '~/models/Collection'
import { ErrorLevel } from '~/models/ErrorReporting'
import { Kind } from '~/models/Kind'
import { Status } from '~/models/Status'
import { User, UserMetadata } from '~/models/User'
import { getCollection } from '~/store/cache/collections/selectors'
import { reformatCollection } from '~/store/cache/collections/utils/reformatCollection'
import { getTrack } from '~/store/cache/tracks/selectors'
import { reformatUser } from '~/store/cache/users/utils'
import { CommonState } from '~/store/reducers'
import { getErrorMessage } from '~/utils/error'
import { Nullable, removeNullable } from '~/utils/typeUtils'

import { Track } from '../models/Track'
import * as cacheActions from '../store/cache/actions'
import * as cacheSelectors from '../store/cache/selectors'

import {
  AudiusQueryContext,
  AudiusQueryContextType
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
  MutationHookResults
} from './types'
import { capitalize, getKeyFromFetchArgs, selectCommonEntityMap } from './utils'
import { accountSelectors } from '../store/account'

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
    fetch: {}
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
        const endpointState = getState().api[reducerPath][endpointName][key]
        if (!endpointState) return
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
      if (idArgKey && fetchArgs[idArgKey]) {
        const idAsNumber =
          typeof fetchArgs[idArgKey] === 'number'
            ? fetchArgs[idArgKey]
            : parseInt(fetchArgs[idArgKey])
        cachedData = cacheSelectors.getEntry(state, {
          kind,
          id: idAsNumber
        })
      } else if (permalinkArgKey && fetchArgs[permalinkArgKey]) {
        if (kind === Kind.TRACKS) {
          cachedData = getTrack(state, {
            permalink: fetchArgs[permalinkArgKey]
          })
        } else if (kind === Kind.COLLECTIONS) {
          cachedData = getCollection(state, {
            permalink: fetchArgs[permalinkArgKey]
          })
        }
      } else if (idListArgKey && fetchArgs[idListArgKey]) {
        const idsAsNumbers: number[] = fetchArgs[idListArgKey].map(
          (id: string | number) => (typeof id === 'number' ? id : parseInt(id))
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

// Rehydrate local normalizedData using entities from global normalized cache
const useCacheData = <Args, Data>(
  endpoint: EndpointConfig<Args, Data>,
  normalizedData: any,
  hookOptions?: QueryHookOptions
) => {
  return useSelector((state: CommonState) => {
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
  }, isEqual)
}

const requestBatcher = createRequestBatcher()

const fetchData = async <Args, Data>(
  fetchArgs: Args,
  endpointName: string,
  endpoint: EndpointConfig<Args, Data>,
  actions: CaseReducerActions<any>,
  context: AudiusQueryContextType,
  force?: MutableRefObject<ForceType>,
  currentUserId?: Nullable<number>
) => {
  const { audiusBackend, dispatch } = context
  try {
    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Loading`]({
        fetchArgs
      }) as FetchLoadingAction
    )

    endpoint.onQueryStarted?.(fetchArgs, { dispatch })

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
              return fetch(fetchArgs, context)
            } catch (e) {
              if (isNonRetryableError(e)) {
                bail(new Error(`Non-retryable error: ${e}`))
              }
              return null
            }
          },
          { ...defaultRetryConfig, ...endpoint.options.retryConfig }
        )
      : await fetch(fetchArgs, context)
    if (apiData == null) {
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
        (user: UserMetadata) => reformatUser(user, audiusBackend)
      )

      // Hack alert: We can't overwrite the current user, since it contains
      // special account data. Once this is removed from user cache we can
      // remove this line.
      if (force?.current && currentUserId) {
        delete entities[Kind.USERS][currentUserId]
      }

      entities[Kind.COLLECTIONS] = mapValues(
        entities[Kind.COLLECTIONS] ?? [],
        (collection: CollectionMetadata | UserCollectionMetadata) =>
          reformatCollection({
            collection,
            audiusBackendInstance: audiusBackend,
            omitUser: false
          })
      )
      dispatch(addEntries(entities, !!force?.current))
      data = result
    } else {
      data = apiData
    }

    if (force?.current) {
      force.current = false
    }

    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Succeeded`]({
        fetchArgs,
        normalizedData: data
      }) as FetchSucceededAction
    )

    endpoint.onQuerySuccess?.(data, fetchArgs, { dispatch })
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
    const force = useRef<ForceType>(hookOptions?.force ? 'force' : false)
    const currentUserId = useSelector(getUserId)
    const queryState = useQueryState(
      fetchArgs,
      reducerPath,
      endpointName,
      endpoint
    )

    // If `force`, ignore queryState and force a fetch
    const state = force.current ? null : queryState

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
      if (force.current === 'forcing') return

      if (force.current === 'force') {
        force.current = 'forcing'
      }
      fetchData(
        fetchArgs,
        endpointName,
        endpoint,
        actions,
        context,
        force,
        currentUserId
      )
    }, [context, fetchArgs, hookOptions?.disabled, status])

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

  api.fetch[endpointName] = (
    fetchArgs: Args,
    context: AudiusQueryContextType
  ) => fetchData(fetchArgs, endpointName, endpoint, actions, context)

  if (endpoint.options.type === 'mutation') {
    api.hooks[`use${capitalize(endpointName)}`] = useMutation
  } else {
    api.hooks[`use${capitalize(endpointName)}`] = useQuery
  }
}
