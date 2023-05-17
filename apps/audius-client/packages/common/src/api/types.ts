import {
  Action,
  CreateSliceOptions,
  PayloadAction,
  Reducer
} from '@reduxjs/toolkit'

import { Kind, Status } from 'models'

import { AudiusQueryContextType } from './AudiusQueryContext'

export type Api = {
  reducer: Reducer<any, Action>
  hooks: {
    [key: string]: (...fetchArgs: any[]) => any
  }
}

export type SliceConfig = CreateSliceOptions<any, any, any>

type EndpointOptions = {
  idArgKey?: string
  schemaKey?: string
  kind?: Kind
}

export type EndpointConfig = {
  fetch: (fetchArgs: any, context: AudiusQueryContextType) => Promise<any>
  options?: EndpointOptions
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
  fetchArgs: any[]
}
export type FetchLoadingAction = PayloadAction<FetchBaseAction & {}>
export type FetchErrorAction = PayloadAction<
  FetchBaseAction & {
    errorMessage: string
  }
>
export type FetchSucceededAction = PayloadAction<
  FetchBaseAction & {
    id: any
    nonNormalizedData: any
    strippedEntityMap: StrippedEntityMap
  }
>

export type PerKeyState = {
  status: Status
  nonNormalizedData?: any
  strippedEntityMap?: StrippedEntityMap
  errorMessage?: string
}

export type PerEndpointState = {
  [key: string]: PerKeyState
}

export type ApiState = {
  [key: string]: PerEndpointState
}

export type CreateApiConfig = {
  reducerPath: string
  endpoints: { [name: string]: EndpointConfig }
}

export type HookOptions = {
  disabled?: boolean
}
