import {
  QueryClient,
  QueryKey,
  QueryFilters,
  useTypedQueryClient as useTanQueryClient
} from '@tanstack/react-query'

import { TypedQueryKey, QueryKeyData } from './typedQueryKeys'

// This merges the QueryClient type (minus our overridden methods) with our TypedQueryClient
export type TypedQueryClient = TypedQueryClientImpl &
  Omit<QueryClient, 'getQueryData' | 'setQueryData' | 'getQueriesData'>

/**
 * TypedQueryClient is a wrapper around QueryClient that provides type-safe
 * methods for getting and setting query data based on query keys
 */
export class TypedQueryClientImpl {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient

    // Create a proxy to forward all methods from queryClient except our overrides
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // If we have the property explicitly defined on our class, use our implementation
        if (prop in target && prop !== 'queryClient') {
          return Reflect.get(target, prop, receiver)
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
  getQueryData<K extends TypedQueryKey>(
    queryKey: K
  ): QueryKeyData<K> | undefined {
    return this.queryClient.getQueryData(queryKey) as
      | QueryKeyData<K>
      | undefined
  }

  /**
   * Sets query data with proper typing based on the query key
   */
  setQueryData<K extends TypedQueryKey>(
    queryKey: K,
    updater:
      | QueryKeyData<K>
      | ((oldData: QueryKeyData<K> | undefined) => QueryKeyData<K>)
  ): QueryKeyData<K> {
    return this.queryClient.setQueryData(queryKey, updater) as QueryKeyData<K>
  }

  /**
   * Gets multiple queries data with proper typing based on query key pattern
   */
  getQueriesData<K extends TypedQueryKey>(
    filters: QueryFilters
  ): [QueryKey, QueryKeyData<K>][] {
    return this.queryClient.getQueriesData(filters) as [
      QueryKey,
      QueryKeyData<K>
    ][]
  }

  /**
   * Access to the original QueryClient for other methods
   */
  get original(): QueryClient {
    return this.queryClient
  }
}

/**
 * Hook to get the typed query client
 */
export function useTypedQueryClient(): TypedQueryClient {
  const queryClient = useTanQueryClient()
  return new TypedQueryClientImpl(queryClient) as unknown as TypedQueryClient
}

/**
 * Hook to directly get typed query data for a specific query key
 */
export function useTypedQueryData<K extends TypedQueryKey>(
  queryKey: K
): QueryKeyData<K> | undefined {
  const typedClient = useTypedQueryClient()
  return typedClient.getQueryData(queryKey)
}

/**
 * Creates a typed query client from an existing QueryClient
 */
export function createTypedQueryClient(
  queryClient: QueryClient
): TypedQueryClient {
  return new TypedQueryClientImpl(queryClient) as unknown as TypedQueryClient
}
