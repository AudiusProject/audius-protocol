import {
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  HashHistoryBuildOptions,
  History
} from 'history'

const USE_HASH_ROUTING = process.env.VITE_USE_HASH_ROUTING === 'true'

let history: History
if (USE_HASH_ROUTING) {
  const config: HashHistoryBuildOptions = {}
  history = createHashHistory(config)
} else {
  const config: BrowserHistoryBuildOptions = {}
  history = createBrowserHistory(config)
}

export default history
