import { Client } from '@elastic/elasticsearch'
import { ApolloServer, gql } from 'apollo-server'
import bodybuilder from 'bodybuilder'

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

  type User {
    id: String!
    handle: String!
    tracks: [Track!]!
  }

  type Query {
    users(handle: String): [User]
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

      // but could also do a search on the tracks index?
      return esc
        .search({
          index: indexNames.tracks,
          query: {
            term: {
              owner_id: parent.user_id,
            },
          },
        })
        .then((r) => r.hits.hits.map((h) => h._source))
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
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
