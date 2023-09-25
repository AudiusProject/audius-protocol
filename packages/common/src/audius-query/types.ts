import {
  Action,
  CaseReducerActions,
  CreateSliceOptions,
  Draft,
  PayloadAction,
  Reducer,
  ThunkAction,
  ThunkDispatch
} from '@reduxjs/toolkit'
import { Dispatch } from 'redux'

import { Kind, Status } from 'models'

import { AudiusQueryContextType } from './AudiusQueryContext'

export type DefaultEndpointDefinitions = {
  [key: string]: EndpointConfig<any, any>
}

export type Api<EndpointDefinitions extends DefaultEndpointDefinitions> = {
  reducer: Reducer<any, Action>
  actions: CaseReducerActions<any>
  hooks: {
    [Property in keyof EndpointDefinitions as `use${Capitalize<
      string & Property
    >}`]: EndpointDefinitions[Property]['options']['type'] extends 'mutation'
      ? () => [
          (
            fetchArgs: Parameters<EndpointDefinitions[Property]['fetch']>[0],
            options?: QueryHookOptions
          ) => void,
          QueryHookResults<
            Awaited<ReturnType<EndpointDefinitions[Property]['fetch']>>
          >
        ]
      : (
          fetchArgs: Parameters<EndpointDefinitions[Property]['fetch']>[0],
          options?: QueryHookOptions
        ) => QueryHookResults<
          Awaited<ReturnType<EndpointDefinitions[Property]['fetch']>>
        >
  }
  util: {
    updateQueryData: <EndpointName extends keyof EndpointDefinitions>(
      endpointName: EndpointName,
      fetchArgs: Parameters<EndpointDefinitions[EndpointName]['fetch']>[0],
      updateRecipe: (
        state: Draft<
          Awaited<ReturnType<EndpointDefinitions[EndpointName]['fetch']>>
        >
      ) => void
    ) => ThunkAction<any, any, any, any>
  }
  /**
   * Allows for pre-fetching of related data into the cache. Does not return the data.
   */
  fetch: {
    [Property in keyof EndpointDefinitions]: (
      fetchArgs: Parameters<EndpointDefinitions[Property]['fetch']>[0],
      context: AudiusQueryContextType
    ) => Promise<void>
  }
}

export type CreateApiConfig = {
  reducerPath: string
  endpoints: { [name: string]: EndpointConfig<any, any> }
}

export type SliceConfig = CreateSliceOptions<any, any, any>

type EndpointOptions = {
  idArgKey?: string
  idListArgKey?: string
  permalinkArgKey?: string
  schemaKey?: string
  kind?: Kind
  type?: 'query' | 'mutation'
}

export type EndpointConfig<Args, Data> = {
  fetch: (fetchArgs: Args, context: AudiusQueryContextType) => Promise<Data>
  options: EndpointOptions
  onQueryStarted?: (fetchArgs: Args, context: { dispatch: Dispatch }) => void
  onQuerySuccess?: (
    data: Data,
    fetchArgs: Args,
    context: { dispatch: ThunkDispatch<any, any, any> }
  ) => void
}

export type EntityMap = {
  [key: string]:
    | {
        [key: string]: any
      }
    | undefined
}

type FetchBaseAction = {
  fetchArgs: any
}
export type FetchLoadingAction = PayloadAction<FetchBaseAction & {}>
export type FetchErrorAction = PayloadAction<
  FetchBaseAction & {
    errorMessage: string
  }
>
export type FetchSucceededAction = PayloadAction<
  FetchBaseAction & {
    nonNormalizedData: any
  }
>
export type FetchResetAction = PayloadAction<FetchBaseAction & {}>

export type ApiState = {
  [key: string]: PerEndpointState<any>
}
export type PerEndpointState<NormalizedData> = {
  [key: string]: PerKeyState<NormalizedData>
}
export type PerKeyState<NormalizedData> = {
  status: Status
  nonNormalizedData?: NormalizedData
  errorMessage?: string
}

export type QueryHookOptions = {
  disabled?: boolean
  shallow?: boolean
  debug?: boolean
}

export type QueryHookResults<Data> = {
  data: Data
  status: Status
  errorMessage?: string
}
