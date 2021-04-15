import { createBrowserHistory, createHashHistory } from 'history'

const USE_HASH_ROUTING = process.env.REACT_APP_USE_HASH_ROUTING
const basename = process.env.PUBLIC_URL

const createHistory = USE_HASH_ROUTING
  ? createHashHistory
  : createBrowserHistory

const config = {}
if (basename) {
  config.basename = basename
}

const history = createHistory(config)
export default history
