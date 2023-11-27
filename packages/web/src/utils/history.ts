import {
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
  HashHistoryBuildOptions,
  History
} from 'history'

const USE_HASH_ROUTING = process.env.VITE_USE_HASH_ROUTING === 'true'
const basename = process.env.VITE_PUBLIC_URL

let history: History
if (USE_HASH_ROUTING) {
  const config: HashHistoryBuildOptions = {}
  if (basename) {
    config.basename = basename
  }
  history = createHashHistory(config)
} else if (typeof window !== 'undefined') {
  const config: BrowserHistoryBuildOptions = {}
  if (basename) {
    config.basename = basename
  }
  history = createBrowserHistory(config)
} else {
  history = createMemoryHistory()
}

export default history
