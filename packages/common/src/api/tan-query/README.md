// table of contents

## Table of Contents

<!-- 1. [Philosophy](#philosophy)
2. [Calling Existing Hooks](#calling-existing-hooks)
3. [Batching](#batching)
4. [Priming / Prefetching Data](#priming--prefetching-data)
5. [Normalization](#normalization)
6. [Default Cache Behavior](#default-cache-behavior) -->

# Purpose

This directory centralizes data fetching and mutation logic using [TanStack Query](https://tanstack.com/query/latest) (v5). It provides React hooks for interacting with the Audius API and managing server state within the client.

```typescript
import {} from '@audius/common/api'
```

# Philosophy

The core goals of using TanStack Query here are:

1.  **Declarative Data Fetching:** Define _what_ data is needed, and let TanStack Query handle _how_ and _when_ to fetch it.
1.  **Normalization:** Store fetched entities (users, tracks, collections) in a normalized way to ensure consistency and efficient updates.
1.  TOOD

# Query Hook Usage

If a hook exists for the data you need, simply call the hook in your component. The hook will handle the selecting and/or fetching of data as needed. In general, you can think of these hooks as source agnostic suppliers of data. For example, `useUser` will return the requested `User` object either from cache or via sdk call. You don't need to know which one.

Hooks typically accept parameters required for the API call and an optional `options` object which can include standard TanStack Query options like `enabled`, `select`, `staleTime`, etc.

#### Hook Options

Most hooks accept an `options` object as their last parameter. Here are common options you might use:

- `enabled`: Boolean that controls whether the query should run. Useful for conditional fetching.
  - note that all of our hooks are written to self-disable if the primary arg is missing or empty (e.g. `useUser(null)`)
- `select`: Function to transform/select data from the raw query result.

#### Return type

- `data` - the data you requested
- `isPending` - true while data is on the way but not yet populated
- `isError`, `error` - true if there's an error; error object

Note: See the tan-stack [useQuery docs](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) for the full return type

## Basic Examples

### Fetching a User

```typescript
import { useUser } from '@audius/common/api'

const UserProfile = ({ userId }: { userId: ID }) => {
  const { data: user, isPending, error } = useUser(userId)

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error fetching user!</div>

  return <h1>{user.name}</h1>
}
```

### Selecting data

The `select` option is powerful for transforming data or extracting only what's needed. Used to select one or more properties from a complex object.

This _improves performance_ as components re-render only when the selected data changes, not when any part of the user object changes.

```typescript
import { useUser } from '@audius/common/api'

const UserNameDisplay = ({ userId }: { userId: ID }) => {
  // Only select the name field, ignoring other user data
  const { data: userName } = useUser(
    userId,
    {
      // Transform the full user object to just the name property
      select: (user) => user.name
    }
  )

  return <span>{userName || 'Unknown user'}</span>
}
```

### Pagination

Many hooks support progressive pagination through the `useInfiniteQuery` pattern.

- `data` is structured with `pages` array containing each page of results

  _Note: many of our paginated queries actually use `select` internally to return a flattened list of data instead of the pages array_

- `fetchNextPage()` loads the next page of data
- `hasNextPage` indicates if more data exists
- `isFetchingNextPage` is `true` while loading the next page

Pagination hook implementation internally handles cursor management between pages.

_Note: for simple pagination, including the `pageNumber` in the `queryKey` array is sufficient to return the appropriate page of data. A standard useQuery can be used for this, but it will not allow for the `fetchNextPage` pattern_

```typescript
import { useTrending } from '@audius/common/api'

const TrendingTracksList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTrending({
    genre: 'All Genres',
    timeRange: 'week'
  })

  // Render the tracks from all pages
  const tracks = data?.pages.flatMap(page => page.tracks) || []

  return (
    <div>
      {tracks.map(track => (
        <TrackTile key={track.id} track={track} />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
```

# Mutations (writes)

Mutations are used for creating, updating, or deleting data. Similar to calling a query hook, calling a mutation hook is simple. However, instead of returning data, they return a callback.

```typescript
const { mutate, /* OR */ mutateAsync } = useMyMutation(args)

const onClickButton = useCallback(() => {
  mutate()
}, [mutate])
```

# Writing Your Own Hooks

## Query Hooks (Fetching Data)

1.  **Define Query Key:**

    - Add a unique key string to the `QUERY_KEYS` object in `queryKeys.ts`.
    - Create an exported function (e.g., `getMyDataQueryKey`) that returns the query key array, usually including parameters. Query keys should be serializable arrays.
    - Use the `QueryKey<T>` type to properly type your query keys for TypeScript inference.

    ```typescript
    // queryKeys.ts
    import { QueryKey } from './types'
    import { MyData } from '~/models/MyData'

    export const QUERY_KEYS = {
      // ... existing keys
      myData: 'myData'
    } as const

    // useMyData.ts
    export const getMyDataQueryKey = (param: string) =>
      [QUERY_KEYS.myData, param] as unknown as QueryKey<MyData>
    ```

    The `as unknown as QueryKey<MyData>` type cast is important for TanStack Query's type inference. The `QueryKey<T>` type uses TanStack's `DataTag` to tell the query client what type of data is stored at this key, enabling better TypeScript support when using `queryClient.getQueryData` and other methods.

1.  **Create the Hook:**

    - Use the `useQuery` or `useInfiniteQuery` (paginated) hook from `@tanstack/react-query`.
    - Use `useAudiusQueryContext` to get access to the `audiusSdk`.
    - Implement the `queryFn` to call the relevant SDK method.
    - Use the query key function defined in step 1.
    - Consider using batching if applicable (see below).

    ```typescript
    // useMyData.ts
    import { useQuery } from '@tanstack/react-query'
    import { useAudiusQueryContext } from '~/audius-query'
    import { MyData } from '~/models'
    import { SelectableQueryOptions } from './types'

    export const getMyDataQueryKey = (param: string) =>
      [QUERY_KEYS.myData, param] as unknown as QueryKey<MyData>

    type UseMyDataParams = {
      param: string
    }

    export const useMyData = <TResult = MyData>(
      params: UseMyDataParams,
      options?: SelectableQueryOptions<MyData, TResult>
    ) => {
      const { audiusSdk } = useAudiusQueryContext()
      const { param } = params

      return useQuery({
        queryKey: getMyDataQueryKey(param),
        queryFn: async () => {
          const sdk = await audiusSdk()
          const result = await sdk.someNamespace.getMyData({ param })
          // Adapt the result if needed
          return result
        },
        ...options,
        // Only enable the query if params are valid
        enabled: options?.enabled !== false && !!param
      })
    }
    ```

## Mutation Hooks (Changing Data)

1.  **Define Types:** Define types for the mutation parameters (`MyMutationParams`) and potentially a context type for optimistic updates (`MutationContext`).
2.  **Create the Hook:**

    - Use the `useMutation` hook from `@tanstack/react-query`.
    - Use `useAudiusQueryContext` for the SDK and `useQueryClient` for cache interaction.
    - Implement the `mutationFn` to call the SDK method that performs the change.
    - Implement `onMutate` for optimistic updates:
      - Cancel relevant ongoing queries (`queryClient.cancelQueries`).
      - Snapshot previous state (`queryClient.getQueryData`).
      - Optimistically update the cache (`queryClient.setQueryData`).
      - Return the previous state in the context. This context will be passed into `onError`
    - Implement `onError` to roll back the optimistic update using the context from `onMutate`.
    - Implement `onSuccess` or `onSettled` to invalidate relevant queries (`queryClient.invalidateQueries`) ensuring the cache syncs with the server state eventually.

    ```typescript
    // useMyMutation.ts
    import { useMutation, useQueryClient } from '@tanstack/react-query'
    import { useAudiusQueryContext } from '~/audius-query'
    import { MyData } from '~/models'
    import { QUERY_KEYS } from './queryKeys'

    export const getMyDataQueryKey = (id: ID) =>
      [QUERY_KEYS.myData, param] as unknown as QueryKey<MyData>

    type MyMutationParams = {
      id: number
      newData: Partial<MyData>
    }

    type MutationContext = {
      previousData: MyData | undefined
    }

    export const useMyMutation = () => {
      const { audiusSdk } = useAudiusQueryContext()
      const queryClient = useQueryClient()

      return useMutation({
        mutationFn: async (params: MyMutationParams) => {
          const sdk = await audiusSdk()
          // Replace with actual SDK call
          return await sdk.someNamespace.updateMyData(params)
        },
        onMutate: async ({ id, newData }): Promise<MutationContext> => {
          const queryKey = getMyDataQueryKey(id) // Example query key to update

          await queryClient.cancelQueries({ queryKey })

          // snapshot the previous data before making the optimistic update
          const previousData = queryClient.getQueryData(queryKey)

          // optimistically update the data
          if (previousData) {
            queryClient.setQueryData(queryKey, {
              ...previousData,
              ...newData
            })
          }

          // this becomes the MutationContext arg in onError
          return { previousData }
        },
        onError: (_error, { id }, context?: MutationContext) => {
          if (context?.previousData) {
            const queryKey = getMyDataQueryKey(id)
            // roll back to the snapshotted data
            queryClient.setQueryData(queryKey, context.previousData)
          }
          // Optionally show an error message
        },
        onSettled: (_data, _error, { id }) => {
          // Always refetch after error or success
          const queryKey = getMyDataQueryKey(id)
          queryClient.invalidateQueries({ queryKey })
        }
      })
    }
    ```

## Batching

To reduce redundant network requests for the same type of entity (e.g., fetching multiple users by ID across different components), we use batching.

- Look at the `batchers/` directory for examples (e.g., `getUsersBatcher`).
- Batchers collect requests over a short time window and make a single API call for multiple resources.
- Inside a query hook's `queryFn`, instead of calling the SDK directly, you obtain an instance of the relevant batcher and call its `fetch` method.

See `useUser.ts` for an example of using `getUsersBatcher`.

### 4. Priming / Prefetching Data

You can manually add or update data in the cache without a full query:

- **Priming (`queryClient.setQueryData`)**: If you already have the data (e.g., from a different API response or after a mutation), you can directly insert it into the cache. This is useful for normalization and optimistic updates.

  ```typescript
  // Inside a component or another hook
  const queryClient = useQueryClient()
  const newUser = { id: 123, name: 'New User' } // Data you already have
  queryClient.setQueryData(getUserQueryKey(123), newUser)
  ```

- **Prefetching (`queryClient.prefetchQuery`)**: If you anticipate needing data soon (e.g., on hover), you can prefetch it so it's likely already cached when the actual `useQuery` mounts.
  ```typescript
  // Inside a component or event handler
  const queryClient = useQueryClient()
  const prefetchUserData = async (userId: number) => {
    const sdk = await audiusSdk() // Assuming you have access to the SDK context
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: () => sdk.users.getUser({ id: userId }) // Replace with actual SDK call
    })
  }
  ```

## Normalization

TanStack Query doesn't enforce normalization itself, but we follow a pattern:

1.  **Fetch Entities by ID:** Hooks like `useUser`, `useTrack`, `useCollection` fetch individual entities and store them under a query key specific to that entity's ID (e.g., `['user', 123]`).
2.  **Fetch Lists of IDs:** Hooks fetching lists (e.g., `useFollowers`, `useFavoritedTracks`) often fetch _only the IDs_ or minimal data for the list itself.
3.  **Combine in UI:** The UI component fetches the list (e.g., follower IDs) and then uses individual entity hooks (`useUser`) for each ID to get the full data. TanStack Query efficiently deduplicates the requests for the individual entities.

This ensures that if a user's details are updated via `useUpdateUser`, all places displaying that user (via `useUser(userId)`) will reflect the change automatically (either through optimistic updates or background refetching). Priming the cache (`queryClient.setQueryData`) after mutations is crucial for this pattern.

## Default Cache Behavior

- **`staleTime: 0` (Default):** Data is considered "stale" immediately after being fetched. This means the _next_ time the component mounts or the query key changes, TanStack Query _can_ refetch in the background if needed. It doesn't necessarily mean a loading state will show; the cached data is still returned instantly.
- **`cacheTime: 5 * 60 * 1000` (Default):** Inactive queries (no active `useQuery` instance for that key) will keep their data in memory for 5 minutes. After this period, the data is garbage collected.

These defaults provide a good balance between showing fresh data and using the cache effectively. Specific hooks might override these defaults if a different behavior is needed (e.g., for data that changes very infrequently).
