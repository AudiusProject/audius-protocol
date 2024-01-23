import {
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  HashHistoryBuildOptions,
  History
} from 'history'

import { env } from 'services/env'

const USE_HASH_ROUTING = env.USE_HASH_ROUTING
const basename = env.BASENAME

let history: History
if (USE_HASH_ROUTING) {
  const config: HashHistoryBuildOptions = {}
  if (basename) {
    config.basename = basename
  }
  history = createHashHistory(config)
} else {
  const config: BrowserHistoryBuildOptions = {}
  if (basename) {
    config.basename = basename
  }
  history = createBrowserHistory(config)
}

export default history
