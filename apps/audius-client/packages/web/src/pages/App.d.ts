import { RefObject } from 'react'

type AppProps = {
  mainContentRef: RefObject<HTMLDivElement>
}

const App: (props: AppProps) => JSX.Element

export const MAIN_CONTENT_ID: 'mainContent'

export default App
