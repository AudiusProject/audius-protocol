# audius-query

## Table of Contents

- [Why audius-query](#why-audius-query)
- [Usage](#usage)
  - [Making an Api](#making-an-api)
  - [Adding an endpoint](#adding-an-endpoint)
  - [Calling the endpoint](#calling-the-endpoint)
- [Cacheing](#cacheing)
  - [Endpoint response cacheing](#endpoint-response-cacheing)
  - [Entity cacheing](#entity-cacheing)
  - [Enable single entity cache hits](#enable-single-entity-cache-hits)
- [Debugging](#debugging)
- [Experimental features](#experimental-features)
  - [Pagination (beta)](#pagination-beta)

## Why audius-query

- Easy data access pattern
- No need to write sagas, slice, and selectors for each new endpoint
- Integrates with the existing entity cache for `Track`, `Collection`, and `User`

## Usage

## Making an api

1. Call `createApi` which will automatically create a slice with scoped data and status for each endpoint

   ```typescript
   const userApi = createApi({
     reducerPath: 'userApi',
     endpoints: {
       // ADD ENDPOINT DEFINITION HERE
     }
   })

   export const {
     /* NAMED HOOK EXPORTS */
   } = userApi.hooks
   export const userApiReducer = userApi.reducer
   ```

1. Add the reducer export to [reducer.ts](reducer.ts)

### Adding an endpoint

1.  Implement the fetch function

    - `audiusClient` and `audiusBackend` are available from the context argument

    ```typescript
    endpoints: {
        getSomeData: {
            fetch: async (
                    { id } /* fetch args */,
                    { apiClient, audiusBackend } /* context */
                ) => {
                    return await apiClient.getSomeData({ id })
                },
            options: {
                // see below
            }
        }
    }
    ```

1.  Endpoint options

    - **`schemaKey`** - the corresponding key in `apiResponseSchema` see [schema.ts](./schema.ts). See [enable entity cachineg on an endpoint](#enable-entity-cacheing-on-an-endpoint) below

      _Note: A schema key is required, though any unreserved key can be used if the data does not contain any of the entities stored in the entity cache (i.e. any of the `Kinds` from [Kind.ts](/packages/common/src/models/Kind.ts))_

    - **`kind`** - in combination with either `idArgKey` or `permalinkArgKey`, allows local cache hits for single entities. If an entity with the matching `kind` and the `id` or `permalink` exists in cache, we will return that instead of calling the fetch function. See [enable single entity cache hits](#enable-single-entity-cache-hits) below
      - **`idArgKey`** - `fetchArgs[idArgKey]` must contain the id of the entity
      - **`permalinkArgKey`** - `fetchArgs[permalinkArgKey]` must contain the permalink of the entity
      - **`idListArgKey`** - works like `idArgKey` but for endpoints that return a list entities

1.  Export hooks

    A Hooks will automatically be generated for each endpoint, using the naming convention `` [`use${capitalize(endpointName)}`] `` (e.g. `getSomeData` -> `useGetSomeData`)

    ```typescript
    const userApi = createApi({
      endpoints: {
        getSomeData: {
          // ...
        }
      }
    })

    // Export the hook for each endpoint here
    export const { useGetSomeData } = userApi.hooks
    export default userApi.reducer
    ```

### Calling the endpoint

1.  Generated fetch hooks take the same args as the fetch function plus an options object. They return the same type returned by the fetch function.

    ```typescript
    type QueryHook = (
        fetchArgs: /* matches the first argument to the endpoint fetch fn */
        options: /* {...} */
    ) => {
        data: /* return value from fetch function */
        status: Status
        errorMessage?: string
    }
    ```

1.  In your component

    ```typescript
    const {
      data: someData,
      status,
      errorMessage
    } = useGetSomeData(
      { id: elementId },
      /* optional */ { disabled: !elementId }
    )

    return status === Status.LOADING ? (
      <Loading />
    ) : (
      <DisplayComponent data={someData} />
    )
    ```

### Hook options

Hooks accept an options object as the optional second argument

- `disabled` - prevents calling the remote fetch function while disabled is false. This is useful if some arguments may not be loaded yet
- `shallow` - skips pulling subentities out of the cache. (e.g. get a track but not the full user inside `track.user`). Omitted subentities will be replaced by id references.

## Cacheing

### Endpoint response cacheing

Each endpoint will keep the lateset response per unique set of `fetchArgs` passed in. This means two separate components calling the same hook with the same arguments will only result in a single remote fetch. However, different endpoints or the same hook with two different arguments passed in will fetch separetly for each.

### Entity cacheing

Audius-query uses the `apiResponseSchema` in [schema.ts](./schema.ts) to extract instances of common entity types from fetched data. Any entities found in the response will be extracted and stored individually in the redux entity cache. The cached copy is the source of truth, and the latest cached version will be returned from audius-query hooks.

### Enable entity cacheing on an endpoint

In order to enable the automated cacheing behavior for your endpoint, please ensure you follow these steps:

1. Add the schema for your response structure to `apiResponseSchema` under the appropriate key

   _Note: If an existing key already represents your data's structure, feel free to use it. For example, many endpoints return a list of users. All of them can share the 'users' key in the schema as the structure is identical._

2. Ensure that the same key is passed as `schemaKey` to your endpoint's options

### Enable single-entity cache hits

We would like hooks like `useGetTrackById({ id: 123 })` which fetch a single entity to be able to hit the cache on their first render. By default, the first call to an audius-query hook with fresh arguments always results in a remote fetch. However for common entities like User, Track, and Collection, it's likely the entity has already been fetched in another part of the app, so we would like to avoid re-fetching them.

In order to enable these single-entity fetches to hit the local cache, we can provide the `kind` and `idArgKey` options to the endpoint. This tells `createApi` where to look in the cache, as a combination of kind and id are sufficient to look up an entity.

#### Example (useGetTrackById)

Here is an example from the `getTrackById` endpoint. Here, the `idArgKey: 'id'` in options corresponds to the `{ id }` argument from the fetch function. This tells us that the arg passed in as `id` to the hook is what we can use to look up the track in the cache.

So for `useGetTrackById({ id: 123 })`

- `fetchArgs` is `{ id: 123 }`
- `fetchArgs[idArgKey]` -> `fetchArgs['id']` -> `123`
- because `kind` is `Kind.TRACK` we call `cacheSelectors.getEntity(Kind.TRACK, { id: 123 })` and retrieve the track if it's already there

```typescript
getTrackById: {
  fetch: async ({ id /* matches idArgKey */ }, { apiClient }) => {
    return await apiClient.getTrack({ id })
  },
  options: {
    idArgKey: 'id',
    kind: Kind.TRACKS,
    schemaKey: 'track'
  }
```

## Debugging

- [createApi.ts](./createApi.ts) contains the implementation of the fetch hooks. You can put breakpoints in `useQuery`. Tip: conditional breakpoints are especially useful since the core logic is shared across every audius-query hook. When debugging, set `debug: true` in `hookOptions` at your hook callsite, then set `hookOptions.debug === true` as the breakpoint condition. Can also try `endpointName === 'myEndpoint && fetchArgs === { ...myArgs }'`.
- Redux debugger - all the data is stored in `state.api['reducerPath']`, and actions are named per endpoint:
  - `fetch${capitalize(endpointName)}Loading`
  - `fetch${capitalize(endpointName)}Succeeded`
  - `fetch${capitalize(endpointName)}Error`

## Experimental features

### Pagination (beta)

see [usePaginatedQuery.ts](./hooks/usePaginatedQuery.ts)

- `usePaginatedQuery` - wraps an audius-query fetch hook which accepts `{ limit, offset }` and handles pagination with our common `{ hasMore, loadMore }` pattern. Returns the current page of results
- `useAllPaginatedQuery` - the same as `usePaginatedQuery` but returns the cumulative list of results

Example usage

```typescript
const {
  data: pageOfUsers,
  status,
  loadMore,
  hasMore
} = usePaginatedQuery(
  useGetFollowingUsers /* accepts { userId, limit, offset } */,
  { userId },
  10 /* page size */
)

return status === Status.LOADING ? (
  <Loading />
) : (
  <PaginatedUserTable
    users={pageOfUsers}
    hasMore={hasMore}
    loadMore={loadMore}
  />
)
```

- `hasMore` - true if there are more results available
- `loadMore` - increments the page counter internal to `usePaginatedQuery`, causing the offset to increment and the next page of results to be fetched and returned from the hook
