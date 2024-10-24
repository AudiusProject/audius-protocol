import type { Timeout } from '@audius/sdk'
import { omit, keyBy } from 'lodash'
import objectHash from 'object-hash'

import { ID } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { AudiusQueryContextType } from './AudiusQueryContext'
import { schemas } from './schema'
import { EndpointConfig } from './types'

// Requests occuring in this period will be batched
const BATCH_PERIOD_MS = 10
const MAX_BATCH_SIZE = 100

type RequestQueueItem<Args, Data> = {
  fetchArgs: Args
  context: AudiusQueryContextType
  resolve: (value: Data) => void
  reject: (error: unknown) => void
}

type RequestGroup = {
  queue: RequestQueueItem<any, any>[]
  timer: Nullable<Timeout>
}

/**
 * Create a request batcher that batches requests for the same endpoint
 */
export const createRequestBatcher = () => {
  const requestGroups: Record<string, RequestGroup> = {}

  const fetch =
    <Args, Data>(
      endpointName: string,
      endpointConfig: EndpointConfig<Args, Data>
    ) =>
    (fetchArgs: Args, context: AudiusQueryContextType) => {
      return new Promise<Data>((resolve, reject) => {
        const idArgKey = endpointConfig.options.idArgKey ?? 'id'

        // Hash the request args and endpointName to determine the request group
        const requestGroupKey = objectHash({
          args: omit(fetchArgs ?? {}, idArgKey),
          endpointName
        })

        requestGroups[requestGroupKey] = requestGroups[requestGroupKey] ?? {
          queue: [],
          timer: null
        }

        const requestGroup = requestGroups[requestGroupKey]

        // Queue the request
        requestGroup.queue = [
          ...requestGroup.queue,
          { fetchArgs, context, resolve, reject }
        ]

        // Set up a timer to perform the batch request
        if (!requestGroup.timer) {
          requestGroup.timer = setTimeout(
            () => performBatch(requestGroup, endpointName, endpointConfig),
            BATCH_PERIOD_MS
          )
        }
      })
    }

  const performBatch = async <Args, Data>(
    requestGroup: RequestGroup,
    endpointName: string,
    endpointConfig: EndpointConfig<Args, Data>
  ): Promise<void> => {
    if (requestGroup.queue.length === 0) return

    const idArgKey = endpointConfig.options.idArgKey ?? 'id'

    // Extract the first MAX_BATCH_SIZE requests from the queue
    const requests = requestGroup.queue.slice(0, MAX_BATCH_SIZE)
    const remainingRequests = requestGroup.queue.slice(MAX_BATCH_SIZE)

    const queuedRequests = [...requests] as RequestQueueItem<Args, Data>[]

    requestGroup.queue = []
    requestGroup.timer = null

    // Extract the IDs from the queued requests
    const ids = queuedRequests.map(
      ({ fetchArgs }) => fetchArgs[idArgKey]
    ) as ID[]

    // Use the context and other args from the most recent request
    // Args are guaranteed to be the same for all requests in the group
    // Context is not guaranteed to be the same, but we use the most recent one
    const mostRecentRequest = queuedRequests[queuedRequests.length - 1]
    const batchArgs = {
      ...omit(mostRecentRequest.fetchArgs ?? {}, idArgKey),
      ids: [...new Set(ids)]
    }

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
            request.resolve(resultEntity as Data)
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

    // If there are remaining requests, perform another batch
    if (remainingRequests) {
      performBatch(
        {
          queue: remainingRequests,
          timer: null
        },
        endpointName,
        endpointConfig
      )
    }
  }

  return {
    fetch
  }
}
