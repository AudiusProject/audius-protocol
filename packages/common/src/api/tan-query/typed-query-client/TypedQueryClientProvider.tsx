import * as React from 'react'

import { TypedQueryClient } from './typedQueryClient'

export const TypedQueryClientContext = React.createContext<
  TypedQueryClient | undefined
>(undefined)

export const useTypedQueryClient = (queryClient?: TypedQueryClient) => {
  const client = React.useContext(TypedQueryClientContext)

  if (queryClient) {
    return queryClient
  }

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client
}

export type TypedQueryClientProviderProps = {
  client: TypedQueryClient
  children?: React.ReactNode
}

export const TypedQueryClientProvider = ({
  client,
  children
}: TypedQueryClientProviderProps): React.JSX.Element => {
  React.useEffect(() => {
    client.mount()
    return () => {
      client.unmount()
    }
  }, [client])

  return (
    <TypedQueryClientContext.Provider value={client}>
      {children}
    </TypedQueryClientContext.Provider>
  )
}
