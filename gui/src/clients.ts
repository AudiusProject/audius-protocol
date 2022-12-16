import {
  ApolloClient,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

const httpLink = createHttpLink({
  uri: 'http://localhost:4000',
})

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const userId = localStorage.getItem('currentUserId') || '1'
  console.log('req userId', userId)
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      'x-user-id': userId,
    },
  }
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(httpLink),
})
