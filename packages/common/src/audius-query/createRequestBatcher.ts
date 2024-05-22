import { omit, keyBy } from 'lodash'

import { ID } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { AudiusQueryContextType } from './AudiusQueryContext'
import { schemas } from './schema'
import { EndpointConfig } from './types'

// Requests occuring in this period will be batched
const BATCH_PERIOD = 50

type RequestQueueItem<Args, Data> = {
  fetchArgs: Args
  context: AudiusQueryContextType
  resolve: (value: Data) => void
  reject: (error: unknown) => void
}

/**
 * Create a request batcher that batches requests for the same endpoint
 */
export const createRequestBatcher = () => {
  const endpoints: Record<
    string,
    {
      queue: RequestQueueItem<any, any>[]
      timer: Nullable<NodeJS.Timeout>
    }
  > = {}

  const fetch =
    <Args, Data>(
      endpointName: string,
      endpointConfig: EndpointConfig<Args, Data>
    ) =>
    (fetchArgs: Args, context: AudiusQueryContextType) => {
      return new Promise<Data>((resolve, reject) => {
        endpoints[endpointName] = endpoints[endpointName] ?? {
          queue: []
        }

        const endpoint = endpoints[endpointName]

        // Queue the request
        endpoint.queue = [
          ...endpoint.queue,
          { fetchArgs, context, resolve, reject }
        ]

        // Set up a timer to perform the batch request
        if (!endpoint.timer) {
          endpoint.timer = setTimeout(
            () => performBatch(endpointName, endpointConfig),
            BATCH_PERIOD
          )
        }
      })
    }

  const performBatch = async <Args, Data>(
    endpointName: string,
    endpointConfig: EndpointConfig<Args, Data>
  ) => {
    if (!endpoints[endpointName]) {
      // TODO: log
      return
    }

    const idArgKey = endpointConfig.options.idArgKey ?? 'id'
    const endpoint = endpoints[endpointName]
    const queuedRequests = [...endpoint.queue] as RequestQueueItem<Args, Data>[]

    endpoint.queue = []
    endpoint.timer = null

    // Extract the IDs from the queued requests
    const ids = queuedRequests.map(
      ({ fetchArgs }) => fetchArgs[idArgKey]
    ) as ID[]

    // Use the context and other args from the most recent request. This does not support
    // varying arguments other than ids between requests. We could add a hash map to the queue
    // to keep track of different arguments if needed.
    const mostRecentRequest = queuedRequests[queuedRequests.length - 1]
    const batchArgs = {
      ...omit(mostRecentRequest.fetchArgs ?? {}, 'id'),
      ids
    } as { ids: ID[] } & Args

    try {
      // Make the batch request
      const result = await endpointConfig.fetchBatch?.(
        batchArgs,
        mostRecentRequest.context
      )

      // Get the schema for the endpoint
      const schema = schemas[endpointConfig.options.schemaKey!]

      // This is necessary because the results are not guaranteed to be in the same order as the
      // requested IDs
      const resultsById = keyBy(result, (result) => {
        return schema.getId(result)
      })

      queuedRequests.forEach((request) => {
        if (result) {
          const resultEntity =
            resultsById[request.fetchArgs[endpointConfig.options.idArgKey!]]

          if (resultEntity) {
            request.resolve(resultEntity as any)
            return
          }
        }
        request.reject(
          new Error(
            `Batched request failed, entity not found: ${endpointName} ${request.fetchArgs}`
          )
        )
      })
    } catch (error) {
      // Reject all promises if the batch request fails
      queuedRequests.forEach((request) => request.reject(error))
    }
  }

  return {
    fetch,
    performBatch
  }
}
