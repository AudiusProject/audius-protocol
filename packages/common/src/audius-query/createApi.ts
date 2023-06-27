import { useCallback, useContext, useEffect, useState } from 'react'

import { CaseReducerActions, createSlice } from '@reduxjs/toolkit'
import { produce } from 'immer'
import { isEqual, mapValues } from 'lodash'
import { denormalize, normalize } from 'normalizr'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch } from 'redux'

import { useProxySelector } from 'hooks/useProxySelector'
import { ErrorLevel } from 'models/ErrorReporting'
import { Kind } from 'models/Kind'
import { Status } from 'models/Status'
import { getCollection } from 'store/cache/collections/selectors'
import { getTrack } from 'store/cache/tracks/selectors'
import { CommonState } from 'store/reducers'
import { getErrorMessage } from 'utils/error'
import { Nullable, removeNullable } from 'utils/typeUtils'

import * as cacheActions from '../store/cache/actions'
import * as cacheSelectors from '../store/cache/selectors'

import {
  AudiusQueryContext,
  AudiusQueryContextType
} from './AudiusQueryContext'
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
  QueryHookResults
} from './types'
import { capitalize, getKeyFromFetchArgs, selectCommonEntityMap } from './utils'

const { addEntries } = cacheActions

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
    hooks: {}
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
  api.util = {
    updateQueryData:
      (endpointName, fetchArgs, updateRecipe) =>
      (dispatch: Dispatch, getState: () => any) => {
        const key = getKeyFromFetchArgs(fetchArgs)
        const endpointState = getState().api[reducerPath][endpointName][key]
        if (!endpointState) return
        const newState = produce(endpointState.nonNormalizedData, updateRecipe)
        const updateAction =
          slice.actions[`fetch${capitalize(endpointName as string)}Succeeded`]
        if (updateAction) {
          dispatch(updateAction({ fetchArgs, nonNormalizedData: newState }))
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
      const scopedState = { ...state[endpointName][key] } ?? initState
      scopedState.status = Status.LOADING
      state[endpointName][key] = scopedState
    },
    [`fetch${capitalize(endpointName)}Error`]: (
      state: ApiState,
      action: FetchErrorAction
    ) => {
      const { fetchArgs, errorMessage } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...state[endpointName][key] } ?? initState
      scopedState.status = Status.ERROR
      scopedState.errorMessage = errorMessage
      state[endpointName][key] = scopedState
    },
    [`fetch${capitalize(endpointName)}Succeeded`]: (
      state: ApiState,
      action: FetchSucceededAction
    ) => {
      const { fetchArgs, nonNormalizedData } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...state[endpointName][key] } ?? initState
      scopedState.status = Status.SUCCESS
      scopedState.nonNormalizedData = nonNormalizedData
      state[endpointName][key] = scopedState
    }
  }
}

const useQueryState = <Args, Data>(
  fetchArgs: Nullable<Args>,
  reducerPath: string,
  endpointName: string,
  endpoint: EndpointConfig<Args, Data>
) => {
  return useSelector((state: CommonState) => {
    if (!state.api[reducerPath]) {
      throw new Error(
        `State for ${reducerPath} is undefined - did you forget to register the reducer in @audius/common/src/api/reducers.ts?`
      )
    }

    if (!fetchArgs) return null

    const key = getKeyFromFetchArgs(fetchArgs)

    const endpointState: PerEndpointState<any> =
      state.api[reducerPath][endpointName]

    // Retrieve data from cache if lookup args provided
    if (!endpointState[key]) {
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

      let cachedData = null
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
          { [schemaKey]: cachedData },
          apiResponseSchema
        )
        return {
          nonNormalizedData: result,
          status: Status.SUCCESS,
          isInitialValue: true,
          errorMessage: undefined
        }
      }
    }

    return { ...endpointState[key] }
  }, isEqual)
}

// Rehydrate local nonNormalizedData using entities from global normalized cache
const useCacheData = <Args, Data>(
  endpoint: EndpointConfig<Args, Data>,
  nonNormalizedData: any,
  hookOptions?: QueryHookOptions
) => {
  return useProxySelector(
    (state: CommonState) => {
      if (hookOptions?.shallow && !endpoint.options.kind)
        return nonNormalizedData
      const entityMap = selectCommonEntityMap(
        state,
        endpoint.options.kind,
        hookOptions?.shallow
      )
      return denormalize(
        nonNormalizedData,
        apiResponseSchema,
        entityMap
      ) as Data
    },
    [nonNormalizedData, apiResponseSchema, endpoint.options.kind]
  )
}

const fetchData = async <Args, Data>(
  fetchArgs: Args,
  endpointName: string,
  endpoint: EndpointConfig<Args, Data>,
  actions: CaseReducerActions<any>,
  context: AudiusQueryContextType,
  dispatch: Dispatch
) => {
  try {
    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Loading`]({
        fetchArgs
      }) as FetchLoadingAction
    )

    endpoint.onQueryStarted?.(fetchArgs, { dispatch })

    const apiData = await endpoint.fetch(fetchArgs, context)
    if (!apiData) {
      throw new Error('Remote data not found')
    }

    let data: any
    if (endpoint.options.schemaKey) {
      const { entities, result } = normalize(
        { [endpoint.options.schemaKey]: apiData },
        apiResponseSchema
      )
      data = result
      dispatch(addEntries(Object.keys(entities), entities))
    } else {
      data = apiData
    }

    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Succeeded`]({
        fetchArgs,
        nonNormalizedData: data
      }) as FetchSucceededAction
    )

    endpoint.onQuerySuccess?.(data, fetchArgs, { dispatch })
  } catch (e) {
    context.reportToSentry({
      error: e as Error,
      level: ErrorLevel.Error,
      additionalInfo: { fetchArgs, endpoint },
      name: `${
        endpoint.options?.type === 'mutation' ? 'Mutate' : 'Query'
      } ${capitalize(endpointName)} error`
    })
    dispatch(
      // @ts-ignore
      actions[`fetch${capitalize(endpointName)}Error`]({
        fetchArgs,
        errorMessage: getErrorMessage(e)
      }) as FetchErrorAction
    )
  }
}

const buildEndpointHooks = <
  EndpointDefinitions extends DefaultEndpointDefinitions,
  Args,
  Data
>(
  api: Api<EndpointDefinitions>,
  endpointName: string,
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
    const queryState = useQueryState(
      fetchArgs,
      reducerPath,
      endpointName,
      endpoint
    )

    const { nonNormalizedData, status, errorMessage, isInitialValue } =
      queryState ?? {
        nonNormalizedData: null,
        status: Status.IDLE
      }

    let cachedData = useCacheData(endpoint, nonNormalizedData, hookOptions)

    const context = useContext(AudiusQueryContext)

    useEffect(() => {
      if (isInitialValue) {
        dispatch(
          // @ts-ignore
          actions[`fetch${capitalize(endpointName)}Succeeded`]({
            fetchArgs,
            nonNormalizedData
          }) as FetchSucceededAction
        )
      }

      const fetchWrapped = async () => {
        if (!context) return
        if ([Status.LOADING, Status.ERROR, Status.SUCCESS].includes(status))
          return
        if (hookOptions?.disabled) return

        fetchData(fetchArgs, endpointName, endpoint, actions, context, dispatch)
      }

      fetchWrapped()
    }, [
      fetchArgs,
      dispatch,
      status,
      isInitialValue,
      nonNormalizedData,
      context,
      hookOptions?.disabled
    ])

    if (endpoint.options?.schemaKey) {
      cachedData = cachedData?.[endpoint.options?.schemaKey]
    }

    return { data: cachedData, status, errorMessage }
  }

  // Hook to be returned as use<EndpointName>
  const useMutation = (
    hookOptions?: QueryHookOptions
  ): [
    (fetchArgs: Args, hookOptions?: QueryHookOptions) => void,
    QueryHookResults<Data>
  ] => {
    const dispatch = useDispatch()
    const [fetchArgs, setFetchArgs] = useState<Args | null>(null)
    const key = getKeyFromFetchArgs(fetchArgs)
    const queryState = useQueryState(
      fetchArgs,
      reducerPath,
      endpointName,
      endpoint
    )

    const { nonNormalizedData, status, errorMessage } = queryState ?? {
      nonNormalizedData: null,
      status: Status.IDLE
    }

    let cachedData = useCacheData(endpoint, nonNormalizedData, hookOptions)
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

        fetchData(
          newFetchArgs,
          endpointName,
          endpoint,
          actions,
          context,
          dispatch
        )
      },
      [key, dispatch, context, hookOptions?.disabled]
    )

    if (endpoint.options?.schemaKey) {
      cachedData = cachedData?.[endpoint.options?.schemaKey]
    }

    return [fetchWrapped, { data: cachedData, status, errorMessage }]
  }

  if (endpoint.options.type === 'mutation') {
    api.hooks[`use${capitalize(endpointName)}`] = useMutation
  } else {
    api.hooks[`use${capitalize(endpointName)}`] = useQuery
  }
}
