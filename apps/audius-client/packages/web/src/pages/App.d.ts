import { MutableRefObject } from 'react'

type AppProps = {
  mainContentRef: MutableRefObject<HTMLDivElement | undefined>
}

const App: (props: AppProps) => JSX.Element

export const MAIN_CONTENT_ID: 'mainContent'

export default App
