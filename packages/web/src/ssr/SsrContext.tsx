import { createContext, memo, useContext } from 'react'

import { Nullable } from '@audius/common'

type SsrContextType = {
  path: Nullable<string>
  isServerSide: boolean
}

export const useSsrContext = () => {
  return useContext(SsrContext)
}

export const SsrContext = createContext({
  path: null,
  isServerSide: true
} as SsrContextType)

export const SsrContextProvider = memo(
  (props: { value: SsrContextType; children: JSX.Element }) => {
    return (
      <SsrContext.Provider value={props.value}>
        {props.children}
      </SsrContext.Provider>
    )
  }
)
