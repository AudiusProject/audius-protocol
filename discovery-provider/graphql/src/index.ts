import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs, resolvers } from './schema'
import knex from 'knex'
import { DiscoveryDB } from './datasources/db'

const dbConfig = {
  client: 'pg',
  connection: {
    host: 'db',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'audius_discovery'
  }
}

const dbConnection = knex(dbConfig)

const server = new ApolloServer({
  typeDefs,
  resolvers
})

export interface Context {
  dataSources: {
    db: ReturnType<typeof DiscoveryDB>
  }
}

startStandaloneServer(server, {
  listen: { port: 6000 },
  context: async () => {
    return {
      dataSources: {
        db: DiscoveryDB(dbConnection)
      }
    }
  }
}).then(({ url }) => {
  console.log(`🚀 Discovery GraphQL server ready at: ${url}`)
})
