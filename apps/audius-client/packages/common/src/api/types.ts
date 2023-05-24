import {
  Action,
  CreateSliceOptions,
  PayloadAction,
  Reducer
} from '@reduxjs/toolkit'

import { Kind, Status } from 'models'

import { AudiusQueryContextType } from './AudiusQueryContext'

export type DefaultEndpointDefinitions = {
  [key: string]: EndpointConfig<any, any>
}

export type Api<EndpointDefinitions extends DefaultEndpointDefinitions> = {
  reducer: Reducer<any, Action>
  hooks: {
    [Property in keyof EndpointDefinitions as `use${Capitalize<
      string & Property
    >}`]: (
      fetchArgs: Parameters<EndpointDefinitions[Property]['fetch']>[0],
      options?: QueryHookOptions
    ) => QueryHookResults<
      Awaited<ReturnType<EndpointDefinitions[Property]['fetch']>>
    >
  }
}

export type CreateApiConfig = {
  reducerPath: string
  endpoints: { [name: string]: EndpointConfig<any, any> }
}

export type SliceConfig = CreateSliceOptions<any, any, any>

type EndpointOptions = {
  idArgKey?: string
  permalinkArgKey?: string
  schemaKey: string
  kind?: Kind
}

export type EndpointConfig<Args, Data> = {
  fetch: (fetchArgs: Args, context: AudiusQueryContextType) => Promise<Data>
  options: EndpointOptions
}

export type EntityMap = {
  [key: string]:
    | {
        [key: string]: any
      }
    | undefined
}
export type StrippedEntityMap = {
  [x: string]: string[] | undefined
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
    strippedEntityMap: StrippedEntityMap
  }
>

export type ApiState = {
  [key: string]: PerEndpointState<any>
}
export type PerEndpointState<NormalizedData> = {
  [key: string]: PerKeyState<NormalizedData>
}
export type PerKeyState<NormalizedData> = {
  status: Status
  nonNormalizedData?: NormalizedData
  strippedEntityMap?: StrippedEntityMap
  errorMessage?: string
}

export type QueryHookOptions = {
  disabled?: boolean
}

export type QueryHookResults<Data> = {
  data: Data
  status: Status
  errorMessage?: string
}
