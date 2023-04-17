import { ApolloClient, InMemoryCache } from '@apollo/client'
import { RestLink } from 'apollo-link-rest'
import { AudiusLibs } from '../../../AudiusLibs'
import { makeSaveTrackMutation } from '../../mutations/trackMutations'

// Use DiscoveryNodeSelector
const baseUri = 'https://discoveryprovider.audius.co/v1/full'

export class AudiusApolloClient {
  constructor(libs: AudiusLibs) {
    // This map defines how each mutation is performed,
    // the lookup is based on the `path` argument to the @rest directive
    const mutations: Record<string, (options: any) => Promise<Response>> = {
      '/track/save': makeSaveTrackMutation(libs)
    }

    const restLink = new RestLink({
      uri: baseUri,
      // Overwrite the default serializer so that the `input` arg
      // isn't stringified
      defaultSerializer: (body, headers) => {
        return { body, headers }
      },
      customFetch: async (uri, options) => {
        // For reads, simply fetch the uri
        if (options.method === 'GET') {
          return fetch(uri)

          // For writes, execute the mutation
          // (with confirmation)
        } else if (options.method === 'POST') {
          const route = (uri as string).replace(baseUri, '')
          return mutations[route](options)
        }
        throw Error('Mutation not defined')
      },
      // This transformer returns the `data` field from the response
      responseTransformer: async (response) =>
        response.json().then(({ data }: any) => data)
    })

    return new ApolloClient({
      link: restLink,
      cache: new InMemoryCache()
    })
  }
}

enum BlockConfirmation {
  CONFIRMED = 'CONFIRMED',
  DENIED = 'DENIED',
  UNKNOWN = 'UNKNOWN'
}

const POLLING_FREQUENCY_MILLIS = 2000

export const confirmMutation =
  (
    performMutation: (
      requestOptions: any
    ) => Promise<{ blockHash: string; blockNumber: number }>
  ) =>
  async (options: any) => {
    // transaction
    const { blockHash, blockNumber } = await performMutation(options)

    // confirmer
    const confirmBlock = async () => {
      const { block_passed } = await (
        await fetch(
          `${baseUri}/block_confirmation?blocknumber=${blockNumber}&blockhash=${blockHash}`
        )
      ).json()

      return block_passed
        ? BlockConfirmation.CONFIRMED
        : BlockConfirmation.UNKNOWN
    }

    let confirmation: BlockConfirmation = await confirmBlock()

    // TODO If timeout, throw error
    while (confirmation === BlockConfirmation.UNKNOWN) {
      await new Promise((resolve) =>
        setTimeout(resolve, POLLING_FREQUENCY_MILLIS)
      )
      confirmation = await confirmBlock()
    }

    if (confirmation === BlockConfirmation.CONFIRMED) {
      // return optimisticResponse
      return new Response(
        JSON.stringify({ data: options.body.optimisticResponse })
      )
    } else {
      throw Error('Transaction failed')
    }
  }
