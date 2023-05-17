import { useContext, useEffect } from 'react'

import { CaseReducerActions, createSlice } from '@reduxjs/toolkit'
import { isEqual } from 'lodash'
import { denormalize, normalize } from 'normalizr'
import { useDispatch, useSelector } from 'react-redux'

import { Status } from 'models/Status'
import { CommonState } from 'store/reducers'
import { getErrorMessage } from 'utils/error'

import * as cacheActions from '../store/cache/actions'
import * as cacheSelectors from '../store/cache/selectors'

import { AudiusQueryContext } from './AudiusQueryContext'
import { apiResponseSchema } from './schema'
import {
  Api,
  ApiState,
  CreateApiConfig,
  EndpointConfig,
  FetchErrorAction,
  FetchLoadingAction,
  FetchSucceededAction,
  HookOptions,
  PerEndpointState,
  PerKeyState,
  SliceConfig
} from './types'
import {
  capitalize,
  getKeyFromFetchArgs,
  selectRehydrateEntityMap,
  stripEntityMap
} from './utils'
const { addEntries } = cacheActions

export const createApi = ({ reducerPath, endpoints }: CreateApiConfig) => {
  const api = {
    reducerPath,
    hooks: {}
  } as unknown as Api

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

const addEndpointToSlice = (sliceConfig: SliceConfig, endpointName: string) => {
  const initState: PerKeyState = {
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
      const { fetchArgs, nonNormalizedData, strippedEntityMap } = action.payload
      const key = getKeyFromFetchArgs(fetchArgs)
      const scopedState = { ...state[endpointName][key] } ?? initState
      scopedState.status = Status.SUCCESS
      scopedState.nonNormalizedData = nonNormalizedData
      scopedState.strippedEntityMap = strippedEntityMap
      state[endpointName][key] = scopedState
    }
  }
}

const buildEndpointHooks = (
  api: Api,
  endpointName: string,
  endpoint: EndpointConfig,
  actions: CaseReducerActions<any>,
  reducerPath: string
) => {
  // Hook to be returned as use<EndpointName>
  const useQuery = (fetchArgs: any, hookOptions?: HookOptions) => {
    const dispatch = useDispatch()
    const key = getKeyFromFetchArgs(fetchArgs)
    const queryState = useSelector((state: any) => {
      const endpointState: PerEndpointState =
        state.api[reducerPath][endpointName]

      // Retrieve data from cache if lookup args provided
      if (!endpointState[key]) {
        if (
          !endpoint.options?.idArgKey ||
          !endpoint.options?.kind ||
          !endpoint.options?.schemaKey
        )
          return null
        const { kind, idArgKey, schemaKey } = endpoint.options
        if (!fetchArgs[idArgKey]) return null
        const idAsNumber =
          typeof fetchArgs[idArgKey] === 'number'
            ? parseInt(fetchArgs[idArgKey])
            : fetchArgs[idArgKey]
        const initialCachedEntity = cacheSelectors.getEntry(state, {
          kind,
          id: idAsNumber
        })

        // cache hit
        if (initialCachedEntity) {
          const { result, entities } = normalize(
            { [schemaKey]: initialCachedEntity },
            apiResponseSchema
          )
          return {
            nonNormalizedData: result,
            status: Status.SUCCESS,
            strippedEntityMap: stripEntityMap(entities),
            isInitialValue: true,
            errorMessage: undefined
          }
        }
      }

      return { ...endpointState[key] }
    }, isEqual)

    const {
      nonNormalizedData,
      status,
      errorMessage,
      strippedEntityMap,
      isInitialValue
    } = queryState ?? {
      nonNormalizedData: null,
      status: Status.IDLE,
      errorMessage: null
    }

    // Rehydrate local nonNormalizedData using entities from global normalized cache
    let cachedData = useSelector((state: CommonState) => {
      const rehydratedEntityMap =
        strippedEntityMap && selectRehydrateEntityMap(state, strippedEntityMap)
      return rehydratedEntityMap
        ? denormalize(nonNormalizedData, apiResponseSchema, rehydratedEntityMap)
        : nonNormalizedData
    }, isEqual)

    const context = useContext(AudiusQueryContext)
    useEffect(() => {
      if (isInitialValue) {
        dispatch(
          // @ts-ignore
          actions[`fetch${capitalize(endpointName)}Succeeded`]({
            fetchArgs,
            nonNormalizedData,
            strippedEntityMap
          }) as FetchSucceededAction
        )
      }

      const fetchWrapped = async () => {
        if (cachedData || !context) return
        if (status === Status.LOADING) return
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

          const { entities, result } = normalize(apiData, apiResponseSchema)
          dispatch(addEntries(Object.keys(entities), entities))
          const strippedEntityMap = stripEntityMap(entities)

          dispatch(
            // @ts-ignore
            actions[`fetch${capitalize(endpointName)}Succeeded`]({
              fetchArgs,
              nonNormalizedData: result,
              strippedEntityMap
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
      strippedEntityMap,
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
