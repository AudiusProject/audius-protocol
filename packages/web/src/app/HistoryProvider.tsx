import { createContext, memo, useContext, useMemo } from 'react'

import {
  History,
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  HashHistoryBuildOptions,
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
const basename = env.BASENAME

export const HistoryContextProvider = memo(
  (props: { children: JSX.Element }) => {
    const history = useMemo(() => {
      if (process.env.NODE_ENV === 'test') {
        return createMemoryHistory()
      } else if (USE_HASH_ROUTING) {
        const config: HashHistoryBuildOptions = {}
        if (basename) {
          config.basename = basename
        }
        return createHashHistory(config)
      } else {
        const config: BrowserHistoryBuildOptions = {}
        if (basename) {
          config.basename = basename
        }
        return createBrowserHistory(config)
      }
    }, [])

    return (
      <HistoryContext.Provider value={{ history }}>
        {props.children}
      </HistoryContext.Provider>
    )
  }
)
