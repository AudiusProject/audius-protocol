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
import AsyncRetry from 'async-retry'

import { Kind, Status } from '~/models'

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
      ? () => MutationHookResults<
          Parameters<EndpointDefinitions[Property]['fetch']>[0],
          Awaited<ReturnType<EndpointDefinitions[Property]['fetch']>>
        >
      : EndpointDefinitions[Property]['options']['type'] extends 'paginatedQuery'
      ? (
          fetchArgs: Parameters<EndpointDefinitions[Property]['fetch']>[0],
          options: PaginatedQueryHookOptions
        ) => PaginatedQueryHookResults<
          Awaited<ReturnType<EndpointDefinitions[Property]['fetch']>>
        >
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
    reset: <EndpointName extends keyof EndpointDefinitions>(
      endpointName: EndpointName
    ) => ThunkAction<any, any, any, any>
  }
  /**
   * Allows for pre-fetching of related data into the cache. Does not return the data.
   */
  fetch: {
    [Property in keyof EndpointDefinitions]: EndpointDefinitions[Property]['fetch']
  }
  fetchSaga: {
    [Property in keyof EndpointDefinitions]: (
      fetchArgs: any,
      force?: boolean
    ) => Generator<any, any, any>
  }
}

export type CreateApiConfig = {
  reducerPath: string
  endpoints: { [name: string]: EndpointConfig<any, any> }
}

export type SliceConfig = CreateSliceOptions<any, any, any>

export type RetryConfig = AsyncRetry.Options

type EndpointOptions = {
  idArgKey?: string
  idListArgKey?: string
  permalinkArgKey?: string
  schemaKey?: string
  kind?: Kind
  retry?: boolean
  retryConfig?: RetryConfig
  type?: 'query' | 'mutation' | 'paginatedQuery'
}

export type EndpointConfig<Args, Data> = {
  fetch: (fetchArgs: Args, context: AudiusQueryContextType) => Promise<Data>
  options: EndpointOptions
  fetchBatch?: (
    fetchArgs: any,
    context: AudiusQueryContextType
  ) => Promise<Data[]>
  onQueryStarted?: (
    fetchArgs: Args,
    context: { dispatch: ThunkDispatch<any, any, any> }
  ) => void
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
    normalizedData: any
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
  normalizedData?: NormalizedData
  errorMessage?: string
}

export type PaginatedQueryArgs = { limit: number; offset: number }

export type QueryHookOptions = {
  disabled?: boolean
  shallow?: boolean
  debug?: boolean
  /** Force a fetch on first render of this hook instance (if a fetch is not already in progress) */
  force?: boolean
  debounce?: number
}

export type PaginatedQueryHookOptions = QueryHookOptions & {
  /**
   * Page size to use.
   * NOTE: if you change this value after the hook was initialized you will cause a cache miss and it will re-fetch data.
   */
  pageSize: number
  /**
   * Toggles single page data mode. If true the hook will only return the current page's data. Equivalent to usePaginatedQuery in the past
   */
  singlePageData?: boolean //
}

export type QueryHookResults<Data> = {
  data: Data
  status: Status
  errorMessage?: string
  forceRefresh: () => void
}

export type PaginatedQueryHookResults<Data extends []> =
  QueryHookResults<Data> & {
    /**
     * Tracks load state for new pages loading in (not the initial page; initial page can be tracked via status).
     * Only used after calling loadMore() first
     */
    isLoadingMore: boolean
    /**
     * Returns false if we get data back that is less than the page size
     */
    hasMore: boolean
    /**
     * Load the next page
     */
    loadMore: () => void
    /**
     * A soft reset to go back to the first page. Doesn't clear the data from the store
     */
    softReset: () => void
    /**
     * A hard reset that goes back to the first page AND clears all the data from the store
     */
    hardReset: () => void
  }

export type MutationHookResponse<Data> = {
  data: Data
  status: Status
  errorMessage?: string
}

export type MutationHookResults<Args, Data> = [
  (fetchArgs: Args, options?: QueryHookOptions) => void,
  MutationHookResponse<Data>
]
