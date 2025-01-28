import {
  createContext,
  memo,
  useRef,
  useContext,
  useState,
  MutableRefObject,
  ReactNode
} from 'react'

export const MAIN_CONTENT_ID = 'mainContent'

export const MainContentContext = createContext({
  setRef: (() => {}) as (node: HTMLDivElement) => void,
  ref: {} as MutableRefObject<HTMLDivElement | undefined>,
  ready: false
})

export const useMainContentRef = () => {
  const { ref } = useContext(MainContentContext)
  return ref
}

export const MainContentContextProvider = memo(
  (props: { children: ReactNode }) => {
    const ref = useRef<HTMLDivElement>()
    const [ready, setReady] = useState(false)
    return (
      <MainContentContext.Provider
        value={{
          setRef: (node: HTMLDivElement) => {
            if (node && !ref.current) {
              ref.current = node
              setReady(true)
            }
          },
          ref,
          ready
        }}
      >
        {props.children}
      </MainContentContext.Provider>
    )
  }
)
