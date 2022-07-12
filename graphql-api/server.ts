import { Client } from '@elastic/elasticsearch'
import { ApolloServer, gql } from 'apollo-server'
import bodybuilder from 'bodybuilder'
import * as ed from '@noble/ed25519'
import { base64 } from '@scure/base'

let url = 'http://localhost:9200'
const esc = new Client({ node: url })

const indexNames = {
  users: 'users',
  tracks: 'tracks',
}

const typeDefs = gql`
  type Track {
    id: String!
    title: String!
  }

  input TrackInput {
    id: String!
    title: String!
  }

  type User {
    id: String!
    handle: String!
    tracks: [Track!]!
  }

  type Query {
    users(handle: String): [User]
  }

  type Mutation {
    updateTrack(track: TrackInput!): Track!
  }
`

const resolvers = {
  Track: {
    id: (parent: any) => parent.track_id,
  },
  User: {
    tracks: async (parent: any) => {
      // does an mget with the denormalized ids
      const ids = parent.tracks.map((t) => t.track_id)
      const got = await esc.mget({ index: indexNames.tracks, ids })
      const tracks = got.docs.map((doc: any) => doc._source)
      return tracks
    },
  },
  Query: {
    users: async (parent: any, args: any) => {
      const bb = bodybuilder()
      if (args.handle) {
        bb.filter('term', 'handle', args.handle)
      }
      return esc
        .search({ index: indexNames.users, ...bb.build() })
        .then((r) => r.hits.hits.map((h) => h._source))
    },
  },
  Mutation: {
    updateTrack: async (parent: any, args: any) => {
      console.log('update track', args)
      return args.track
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
  context: async ({ req }) => {
    if (req.body.operationName !== 'IntrospectionQuery') {
      const pubkey = req.headers['x-pubkey'] as string
      const sig = req.headers['x-sig'] as string

      // apollo-server uses apollo-server-express by default
      // which will automatically JSON parse the POST payload
      // so we have to re-serialize it here to verify signature
      // which is kinda gross...
      // either apollo-server-micro or some custom express middleware could probably run before the body parser
      const reconstructedPayload = JSON.stringify(req.body)
      const payloadBytes = new TextEncoder().encode(reconstructedPayload)

      if (pubkey && sig) {
        const isValid = await ed.verify(
          base64.decode(sig),
          payloadBytes,
          base64.decode(pubkey)
        )
        console.log({ isValid })
      }
    }
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
