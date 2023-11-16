import { createContext, memo, useRef, MutableRefObject } from 'react'

export const MAIN_CONTENT_ID = 'mainContent'

export const MainContentContext = createContext({
  mainContentRef: {} as MutableRefObject<HTMLDivElement | undefined>
})

export const MainContentContextProvider = memo(
  (props: { children: JSX.Element }) => {
    const mainContentRef = useRef<HTMLDivElement>()
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
