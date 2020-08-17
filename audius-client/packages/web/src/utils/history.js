import { createBrowserHistory } from 'history'

const basename = process.env.PUBLIC_URL

const config = {}
if (basename) {
  config.basename = basename
}

const history = createBrowserHistory(config)
export default history
