import { createContext, memo, useRef, RefObject } from 'react'

export const MainContentContext = createContext<{
  mainContentRef: RefObject<HTMLDivElement>
}>({
  mainContentRef: { current: null }
})

export const MainContentContextProvider = memo(
  (props: { children: JSX.Element }) => {
    const mainContentRef = useRef<HTMLDivElement>(null)
    return (
      <MainContentContext.Provider
        value={{
          mainContentRef
        }}
      >
        {props.children}
      </MainContentContext.Provider>
    )
  }
)
