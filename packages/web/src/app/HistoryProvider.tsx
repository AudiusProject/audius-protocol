import { createContext, memo, useContext } from 'react'

import { History } from 'history'

import { useSsrContext } from 'ssr/SsrContext'
import { createHistory } from 'utils/history'

export type HistoryContextType = {
  history: History
}

export const useHistoryContext = () => {
  return useContext(HistoryContext)
}

export const HistoryContext = createContext<HistoryContextType>({
  history: null as any
})

// TODO: could put getPathname in here
export const HistoryContextProvider = memo(
  (props: { children: JSX.Element }) => {
    const { history: ssrHistory } = useSsrContext()
    const history = ssrHistory || createHistory()
    return (
      <HistoryContext.Provider value={{ history }}>
        {props.children}
      </HistoryContext.Provider>
    )
  }
)
