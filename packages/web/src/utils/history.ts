import {
  BrowserHistoryBuildOptions,
  createBrowserHistory,
  createHashHistory,
  HashHistoryBuildOptions
} from 'history'

const USE_HASH_ROUTING = process.env.VITE_USE_HASH_ROUTING === 'true'
const basename = process.env.VITE_PUBLIC_URL

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
