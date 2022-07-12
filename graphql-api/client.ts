import {
  ApolloClient,
  HttpLink,
  HttpOptions,
  InMemoryCache,
} from '@apollo/client'
import { gql } from 'apollo-server'
import * as ed from '@noble/ed25519'
import { base64 } from '@scure/base'

const customFetch: HttpOptions['fetch'] = async (uri, options) => {
  if (options?.body && options.headers) {
    const keypair = await makeKeypair()
    const payloadBytes = new TextEncoder().encode(options.body.toString())
    const sig = await ed.sign(payloadBytes, keypair.privateKey)

    const headers: any = options.headers
    headers['x-pubkey'] = base64.encode(keypair.publicKey)
    headers['x-sig'] = base64.encode(sig)

    // verify it locally... in reality this would happen on server
    {
      const pubkey = base64.decode(headers['x-pubkey'])
      const sig = base64.decode(headers['x-sig'])
      const isValid = await ed.verify(sig, payloadBytes, pubkey)
      console.log('is valid???', isValid)
    }
  }

  console.log('fetch', uri, options)
  return fetch(`${uri}`, options)
}

async function makeKeypair() {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKey(privateKey)
  return { publicKey, privateKey }
}

const link = new HttpLink({
  uri: 'http://localhost:4000',
  fetch: customFetch,
})

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
})

async function main() {
  const result = await client.mutate({
    mutation: gql`
      mutation ($track: TrackInput!) {
        updateTrack(track: $track) {
          title
        }
      }
    `,
    variables: {
      track: {
        id: '123',
        title: 'abc',
      },
    },
  })

  console.log(result)
}

main()
