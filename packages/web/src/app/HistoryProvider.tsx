import { createContext, memo, useContext, useMemo } from 'react'

import {
  History,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory
} from 'history'

import { env } from 'services/env'

export type HistoryContextType = {
  history: History
}

export const useHistoryContext = () => {
  return useContext(HistoryContext)
}

export const HistoryContext = createContext<HistoryContextType>({
  history: null as any
})

const USE_HASH_ROUTING = env.USE_HASH_ROUTING

export const HistoryContextProvider = memo(
  (props: { children: JSX.Element }) => {
    const history = useMemo(() => {
      if (process.env.NODE_ENV === 'test') {
        return createMemoryHistory()
      } else if (USE_HASH_ROUTING) {
        return createHashHistory()
      } else {
        return createBrowserHistory()
      }
    }, [])

    return (
      <HistoryContext.Provider value={{ history }}>
        {props.children}
      </HistoryContext.Provider>
    )
  }
)
