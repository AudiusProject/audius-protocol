import { useContext } from 'react'

import {
  QueryClient,
  QueryKey,
  QueryFilters,
  QueryClientContext
} from '@tanstack/react-query'

import { TypedQueryKey, QueryKeyData } from './queryKeys'

// This merges the QueryClient type (minus our overridden methods) with our TypedQueryClient
export type TypedQueryClient = TypedQueryClientImpl &
  Omit<QueryClient, 'getQueryData' | 'setQueryData' | 'getQueriesData'>

/**
 * TypedQueryClient is a wrapper around QueryClient that provides type-safe
 * methods for getting and setting query data based on query keys
 */
export class TypedQueryClientImpl {
  private readonly _queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this._queryClient = queryClient

    // Store a reference to this instance
    const instance = this

    // Create a proxy to forward all methods from queryClient except our overrides
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // If we have the property explicitly defined on our class, use our implementation
        if (prop in target && prop !== '_queryClient') {
          const value = Reflect.get(target, prop, receiver)

          // If it's a method, we need to ensure it accesses the correct queryClient
          if (typeof value === 'function') {
            return function (...args: any[]) {
              // Force the context to be the original instance with _queryClient
              return value.apply(instance, args)
            }
          }
          return value
        }

        // Otherwise forward to the original queryClient
        const value = Reflect.get(queryClient, prop)

        // If it's a method, bind it to the original queryClient
        if (typeof value === 'function') {
          return value.bind(queryClient)
        }

        return value
      }
    }) as unknown as TypedQueryClient
  }

  /**
   * Gets query data with proper typing based on the query key
   */
  getQueryData<TData, K extends TypedQueryKey = TypedQueryKey>(
    queryKey: K
  ): QueryKeyData<TData, K> | undefined {
    return this._queryClient.getQueryData(queryKey) as QueryKeyData<TData, K>
  }

  /**
   * Sets query data with proper typing based on the query key
   */
  setQueryData<TData, K extends TypedQueryKey = TypedQueryKey>(
    queryKey: K,
    updater:
      | QueryKeyData<TData, K>
      | ((
          oldData: QueryKeyData<TData, K> | undefined
        ) => QueryKeyData<TData, K>)
  ): QueryKeyData<TData, K> {
    return this._queryClient.setQueryData(queryKey, updater) as QueryKeyData<
      TData,
      K
    >
  }

  /**
   * Gets multiple queries data with proper typing based on query key pattern
   */
  getQueriesData<TData, K extends TypedQueryKey = TypedQueryKey>(
    filters: QueryFilters
  ): [QueryKey, QueryKeyData<TData, K>][] {
    return this._queryClient.getQueriesData(filters) as [
      QueryKey,
      QueryKeyData<TData, K>
    ][]
  }

  /**
   * Access to the original QueryClient for other methods
   */
  get original(): QueryClient {
    return this._queryClient
  }
}

/**
 * Hook to get the typed query client from the context
 */
export const useTypedQueryClient = () => {
  const queryClient = useContext(QueryClientContext)
  return queryClient as unknown as TypedQueryClient
}

/**
 * Hook to directly get typed query data for a specific query key
 */
export function useTypedQueryData<
  TData = unknown,
  K extends TypedQueryKey = TypedQueryKey
>(queryKey: K): QueryKeyData<TData, K> | undefined {
  const typedClient = useTypedQueryClient()
  return typedClient.getQueryData<TData, K>(queryKey)
}

/**
 * Creates a typed query client from an existing QueryClient
 */
export function createTypedQueryClient(
  queryClient: QueryClient
): TypedQueryClient {
  return new TypedQueryClientImpl(queryClient) as TypedQueryClient
}
