import {
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  HashHistoryBuildOptions
} from 'history'

import { env } from 'services/env'

const USE_HASH_ROUTING = env.USE_HASH_ROUTING
const basename = env.BASENAME

export const createHistory = () => {
  if (USE_HASH_ROUTING) {
    const config: HashHistoryBuildOptions = {}
    if (basename) {
      config.basename = basename
    }
    return createHashHistory(config)
  } else {
    const config: BrowserHistoryBuildOptions = {}
    if (basename) {
      config.basename = basename
    }
    return createBrowserHistory(config)
  }
}
