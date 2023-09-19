import './App.css'
import { Ingest } from './Ingest'
import { Listen } from './Listen'
import { Login } from './Login'
import { Upload } from './Upload'
import { Validate } from './Validate'
import { State, appStore } from './store'

function App() {
  const appState = appStore((state) => state.appState)
  return (
    <>
      DDEX Uploader
      {appState === State.Login && <Login />}
      {appState === State.Ingest && <Ingest />}
      {appState === State.Validate && <Validate />}
      {appState === State.Upload && <Upload />}
      {appState === State.Listen && <Listen />}
    </>
  )
}

export default App
