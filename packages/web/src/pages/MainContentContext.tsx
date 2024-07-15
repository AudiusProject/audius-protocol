import {
  createContext,
  memo,
  useRef,
  MutableRefObject,
  useContext
} from 'react'

export const MAIN_CONTENT_ID = 'mainContent'

export const MainContentContext = createContext({
  mainContentRef: {} as MutableRefObject<HTMLDivElement | undefined>
})

export const useMainContentRef = () => {
  const { mainContentRef } = useContext(MainContentContext)
  return mainContentRef
}

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
