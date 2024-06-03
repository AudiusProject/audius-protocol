import { createContext, memo, useContext } from 'react'

import { History } from 'history'

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

const history = createHistory()

// TODO: could put getPathname in here
export const HistoryContextProvider = memo(
  (props: { children: JSX.Element }) => {
    return (
      <HistoryContext.Provider value={{ history }}>
        {props.children}
      </HistoryContext.Provider>
    )
  }
)
