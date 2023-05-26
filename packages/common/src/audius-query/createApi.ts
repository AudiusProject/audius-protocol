import { useContext, useEffect } from 'react'

import { CaseReducerActions, createSlice } from '@reduxjs/toolkit'
import { isEqual } from 'lodash'
import { denormalize, normalize } from 'normalizr'
import { useDispatch, useSelector } from 'react-redux'

import { useProxySelector } from 'hooks/useProxySelector'
import { Kind } from 'models/Kind'
import { Status } from 'models/Status'
import { getCollection } from 'store/cache/collections/selectors'
import { getTrack } from 'store/cache/tracks/selectors'
import { CommonState } from 'store/reducers'
import { getErrorMessage } from 'utils/error'

import * as cacheActions from '../store/cache/actions'
import * as cacheSelectors from '../store/cache/selectors'

import { AudiusQueryContext } from './AudiusQueryContext'
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
    const key = getKeyFromFetchArgs(fetchArgs)
    const queryState = useSelector((state: CommonState) => {
      if (!state.api[reducerPath]) {
        throw new Error(
          `State for ${reducerPath} is undefined - did you forget to register the reducer in @audius/common/src/api/reducers.ts?`
        )
      }
      const endpointState: PerEndpointState<any> =
        state.api[reducerPath][endpointName]

      // Retrieve data from cache if lookup args provided
      if (!endpointState[key]) {
        if (
          !(endpoint.options?.idArgKey || endpoint.options?.permalinkArgKey) ||
          !endpoint.options?.kind ||
          !endpoint.options?.schemaKey
        )
          return null
        const { kind, idArgKey, permalinkArgKey, schemaKey } = endpoint.options
        if (idArgKey && !fetchArgs[idArgKey]) return null
        if (permalinkArgKey && !fetchArgs[permalinkArgKey]) return null

        const idAsNumber = idArgKey
          ? typeof fetchArgs[idArgKey] === 'number'
            ? parseInt(fetchArgs[idArgKey])
            : fetchArgs[idArgKey]
          : null
        const idCachedEntity = idAsNumber
          ? cacheSelectors.getEntry(state, {
              kind,
              id: idAsNumber
            })
          : null

        let permalinkCachedEntity = null
        if (kind === Kind.TRACKS && permalinkArgKey) {
          permalinkCachedEntity = getTrack(state, {
            permalink: fetchArgs[permalinkArgKey]
          })
        }
        if (kind === Kind.COLLECTIONS && permalinkArgKey) {
          permalinkCachedEntity = getCollection(state, {
            permalink: fetchArgs[permalinkArgKey]
          })
        }

        const cachedEntity = idCachedEntity || permalinkCachedEntity

        // cache hit
        if (cachedEntity) {
          const { result } = normalize(
            { [schemaKey]: cachedEntity },
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

    const { nonNormalizedData, status, errorMessage, isInitialValue } =
      queryState ?? {
        nonNormalizedData: null,
        status: Status.IDLE
      }

    // Rehydrate local nonNormalizedData using entities from global normalized cache
    let cachedData: Data = useProxySelector(
      (state: CommonState) => {
        const entityMap = selectCommonEntityMap(state, endpoint.options.kind)
        return denormalize(nonNormalizedData, apiResponseSchema, entityMap)
      },
      [nonNormalizedData, apiResponseSchema, endpoint.options.kind]
    )

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

        try {
          dispatch(
            // @ts-ignore
            actions[`fetch${capitalize(endpointName)}Loading`]({
              fetchArgs
            }) as FetchLoadingAction
          )
          const apiData = await endpoint.fetch(fetchArgs, context)
          if (!apiData) {
            throw new Error('Remote data not found')
          }

          const { entities, result } = normalize(
            { [endpoint.options.schemaKey]: apiData },
            apiResponseSchema
          )
          dispatch(addEntries(Object.keys(entities), entities))

          dispatch(
            // @ts-ignore
            actions[`fetch${capitalize(endpointName)}Succeeded`]({
              fetchArgs,
              nonNormalizedData: result
            }) as FetchSucceededAction
          )
        } catch (e) {
          dispatch(
            // @ts-ignore
            actions[`fetch${capitalize(endpointName)}Error`]({
              fetchArgs,
              errorMessage: getErrorMessage(e)
            }) as FetchErrorAction
          )
        }
      }
      fetchWrapped()
    }, [
      fetchArgs,
      cachedData,
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
  api.hooks[`use${capitalize(endpointName)}`] = useQuery
}
