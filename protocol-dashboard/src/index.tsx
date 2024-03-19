import { createRoot } from 'react-dom/client'

import App from './App'

import 'setimmediate'
import 'simplebar-react/dist/simplebar.min.css'
import '@audius/stems/dist/avenir.css'
import '@audius/stems/dist/stems.css'
import '@audius/harmony/dist/harmony.css'
import './index.css'

const rootElement = document.getElementById('root')
createRoot(rootElement).render(<App />)
