# audius-query

## Table of Contents

- [audius-query](#audius-query)
  - [Table of Contents](#table-of-contents)
  - [Why audius-query](#why-audius-query)
  - [Usage](#usage)
  - [Make an api](#make-an-api)
  - [Add a query endpoint](#add-a-query-endpoint)
  - [Adding a mutation endpoint](#adding-a-mutation-endpoint)
  - [Adding optimistic updates to your mutation endpoint](#adding-optimistic-updates-to-your-mutation-endpoint)
  - [Paginating Your Query Endpoint](#paginating-your-query-endpoint)
  - [Pre-fetching related entities](#pre-fetching-related-entities)
    - [Cascading hooks](#cascading-hooks)
    - [Pre-fetching in endpoint implementations](#pre-fetching-in-endpoint-implementations)
    - [Batching requests](#batching-requests)
  - [Query Hook options](#query-hook-options)
  - [Caching](#caching)
    - [Endpoint response caching](#endpoint-response-caching)
    - [Entity caching](#entity-caching)
    - [Enable entity caching on an endpoint](#enable-entity-caching-on-an-endpoint)
    - [Enable single-entity cache hits](#enable-single-entity-cache-hits)
      - [Example (useGetTrackById)](#example-usegettrackbyid)
  - [Debugging](#debugging)

## Why audius-query

- Easy data access pattern
- No need to write sagas, slice, and selectors for each new endpoint
- Integrates with the existing entity cache for `Track`, `Collection`, and `User`

## Usage

## Make an api

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

## Add a query endpoint

1.  Implement the fetch function

    - `audiusClient` and `audiusBackend` are available from the context argument

    ```typescript
    endpoints: {
      getSomeData: {
        fetch: async (
          { id } /* fetch args */,
          { audiusBackend } /* context */
        ) => {
          return await getSomeData({ id })
        },
        options: {
          // see below
        }
      }
    }
    ```

1.  Add relevant endpoint options

    - **`schemaKey`** - the corresponding key in `apiResponseSchema` see [schema.ts](./schema.ts). See [enable entity caching on an endpoint](#enable-entity-caching-on-an-endpoint) below

      _Note: A schema key is required, though any unreserved key can be used if the data does not contain any of the entities stored in the entity cache (i.e. any of the `Kinds` from [Kind.ts](/packages/common/src/models/Kind.ts))_

    - **`kind`** - in combination with either `idArgKey` or `permalinkArgKey`, allows local cache hits for single entities. If an entity with the matching `kind` and the `id` or `permalink` exists in cache, we will return that instead of calling the fetch function. See [enable single entity cache hits](#enable-single-entity-cache-hits) below
    - **`idArgKey`** - `fetchArgs[idArgKey]` must contain the id of the entity
    - **`permalinkArgKey`** - `fetchArgs[permalinkArgKey]` must contain the permalink of the entity
    - **`idListArgKey`** - works like `idArgKey` but for endpoints that return a list entities
    - **`type`** - by default endpoint additions are viewed as "queries" ie methods that fetch data. Specifying `type: 'mutation'` tells audius-query you are implementing a method that will write data to the server.
    - **`retry`** - enables retries for the endpoint. The fetch function will automatically be called multiple times, with the final error bubbling up if all retries are exhausted. Fetches resulting in `400`, `401`, and `403` are never retried.
    - **`retryConfig`** - Overrides the default retry config for advanced use cases. The options are passed directly to [`async-retry`](https://github.com/vercel/async-retry).
    - **`fetchBatch`** - If specified, the endpoint will automatically batch groups of requests that fall into a batch period. `fetchBatch` takes an args object containing an `ids` array and should return an array of entities. It requires that you specify both the `idArgKey` and `schemaKey` options

1.  Export the query hook

    A Hook will automatically be generated for each endpoint, using the naming convention `` [`use${capitalize(endpointName)}`] `` (e.g. `getSomeData` -> `useGetSomeData`)

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

1.  Use the query hook

- Generated fetch hooks take the same args as the fetch function plus an options object. They return the same type returned by the fetch function.

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

- In your component:

  ```typescript
  const {
    data: someData,
    status,
    errorMessage
  } = useGetSomeData({ id: elementId }, /* optional */ { disabled: !elementId })

  return status === Status.LOADING ? (
    <Loading />
  ) : (
    <DisplayComponent data={someData} />
  )
  ```

## Adding a mutation endpoint

1.  Implement the fetch function

    ```typescript
    endpoints: {
      updateSomeData: {
        fetch: async (
          { id } /* fetch args */,
          { audiusBackend } /* context */
        ) => {
          return await updateSomeData({ id })
        },
        options: {
          type: 'mutation', // This turns endpoint into a mutation
          // Same additional options as query endpoint
        }
      }
    }
    ```

1.  Export hooks (same process as query endpoints)

1.  Use hook in your component

    ```typescript
    const [updateSomeData, result] = useUpdateSomeData()
    const { data: someData, status, errorMessage } = result


    return (
      <Button text="Update some data" onClick={updateSomeData} />
      {status === Status.LOADING ? (
        <Loading />
      ) : (
        someData ? <DisplayComponent data={someData} /> : null
      )}
    )
    ```

## Adding optimistic updates to your mutation endpoint

In some cases, you may want to update the cache manually. When you wish to update cache data that already exists for query endpoints, you can do so using the updateQueryData thunk action available on the util object of your created API.

```typescript
const api = createApi({
  reducerPath: 'someData',
  endpoints: {
    getSomeData: {
      fetch: async ({ id }, { }) => {
        return await getSomeData({ id })
      }
    }
    updateSomeData: {
      fetch: async ( { id } { }) => {
        return await updateSomeData({ id })
      },
      options: {
        type: 'mutation',
      },
      onQueryStarted: async (updatedData, { id }, { dispatch }) => {
        dispatch(
          api.util.updateQueryData(
            'getSomeData',
            { id },
            (draft) => {
              Object.assign(draft, updatedData)
            }
          )
        )
      }
    }
  }
})
```

## Paginating Your Query Endpoint

If your endpoint has pagination, you can use the type `'paginatedQuery'` instead of `'query'`.

This will modify the query hook to pass `limit` and `offset` params and returns data in page chunks.

By default it will aggregate all pages that you've requested 

Example usage

```typescript
// Set up a paginated query
const userApi = createApi({
      endpoints: {
        getSomeData: {
          // ...
        },
        { type: 'paginatedQuery' }
      }
    })

// Using the query
const {
    data,
    status, // Same as query type but also includes sub-state LOADING_MORE for new pages loading
    loadMore, // Callback to increment the page and load more data
    reset, // Resets back to the first page, with an option to clear the cache data out as well
    hasMore // 
  } = useGetSomeData(
    { ...args },
    {
      pageSize: 5, // Pass your desired page size
      singlePageData: false // (Optional) Enable this if you only want one page of data at a time (not an aggregated list)
    }
  )
```

## Pre-fetching related entities

Many endpoints return related data as nested fields (ex. Tracks including a user field with basic info about a user). However, some endpoints only return identifiers pointing to the related entities. In cases where we know we will need that information before rendering, there are a couple of options.

### Cascading hooks

The simpler and more common usage is to use the output of one hook as the input for another:

```typescript
const { data: firstDataset, status: firstDatasetStatus } = useFirstDataset()
const { data: secondDataset, status: secondDatasetStatus } = useSecondDataset(
  firstDataset,
  {
    disabled: firstDatasetStatus !== Status.Success
  }
)

return secondDatasetStatus === Status.Success ? (
  <SomeMultiDatasetComponent
    firstSet={firstDataset}
    secondSet={secondDataset}
  />
) : null
```

### Pre-fetching in endpoint implementations

The cascading hooks approach works well if you are loading a set of information, mapping it with another fetch, then
rendering the data. However, it falls apart a bit if you are working with _paginated data_. Fetching the first page and
mapping it is the same as before. But when fetching subsequent pages, we need some pretty messy logic to defer adding the
new page of data until its related entities have been fetched.

API definitions can opt in to exposing raw fetch functions by exporting the `api.fetch` property:

```typescript
const tracksApi = createApi(...)

export const tracksFetchApi = tracksApi.fetch
```

The raw fetch implementations are designed to be called from other API endpoint definitions and will require passing in the `AudiusQueryContext`.

The following approach works well for fetching pages of data, then pre-fetching related data that will be queried via other api hooks in child components. For example, the Purchases table fetches a list of records that include content IDs, and then each individual row will attempt to look up the content by ID using the appropriate useGetTrackById() hook. Since the data has already been pre-fetched, the hooks in child components should hit cached values. If they happen to miss, they will go ahead and fetch.

```typescript
import {tracksFetchApi} from './tracksApi'

const purchasesApi = createApi({
  endpoints:
    getPurchases: async (args, context, options) => {
      //... fetch purchases
      const trackIdsToFetch = purchases.map(extractTrackIds)
      await tracksFetchApi.getTracksByIds({ids: trackIdsToFetch}, context)
      return purchases
    }
})
```

Note that in the above code, we're simply issuing a fetch for the related tracks, which will be inserted into the cache, before returning our original data. This is merely a performance optimization.

### Batching requests

If you want to use a "get by id" pattern in leaf components such as a list of tracks, it's recommended to batch the requests so that only a single request is performed. This can be achieved by specifying the `fetchBatch` function on the endpoint:

```typescript
const trackApi = createApi({
  endpoints: {
    getTrackById: {
      fetch: async (
        { id }: { id: ID },
        context
      ) => {
        // return a single track
      },
      fetchBatch: async (
        { ids }: { ids: ID[]; },
        context
      ) => {
        // return an array of tracks
      },
      options: {
        idArgKey: 'id',
        schemaKey: 'track'
      }
    },
```

Audius-query will automatically merge requests that fall within a short time frame (10 ms) into a single bulk request. It only merges requests that have the same arguments, exlcuding the id argument. You can continue to use the resulting hooks as usual, and all the entities will continue to have the same caching behavior as non-batched.

## Query Hook options

Query Hooks accept an options object as the optional second argument

- `disabled` - prevents calling the remote fetch function while disabled is false. This is useful if some arguments may not be loaded yet
- `shallow` - skips pulling subentities out of the cache. (e.g. get a track but not the full user inside `track.user`). Omitted subentities will be replaced by id references.
- `force` - forces a fetch to occur when the hook instance renders for the first time. This is useful for data which should be re-fetched when a user navigates away from and back to a page.

## Caching

### Endpoint response caching

Each endpoint will keep the latest response per unique set of `fetchArgs` passed in. This means two separate components calling the same hook with the same arguments will only result in a single remote fetch. However, different endpoints or the same hook with two different arguments passed in will fetch separately for each.

### Entity caching

Audius-query uses the `apiResponseSchema` in [schema.ts](./schema.ts) to extract instances of common entity types from fetched data. Any entities found in the response will be extracted and stored individually in the redux entity cache. The cached copy is the source of truth, and the latest cached version will be returned from audius-query hooks.

### Enable entity caching on an endpoint

In order to enable the automated caching behavior for your endpoint, please ensure you follow these steps:

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
  fetch: async ({ id /* matches idArgKey */ }, {  }) => {
    return await .getTrack({ id })
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