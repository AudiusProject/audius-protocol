import { env } from 'services/env'
import { isElectron } from 'utils/clientUtil'

const ENV = env().ENVIRONMENT
// const SCHEME = env().SCHEME

// On startup, when this script is included, create a link to the
// downloaded electron app (if available) and try redirecting to it.
// If no redirect happens, this is a no-op.
if (!isElectron() && ENV === 'production') {
  // const appUrl = window.location.href
  //   .replace('http://', '')
  //   .replace('https://', '')
  //   .replace(window.location.host, `${SCHEME}:/`)
  // window.location = appUrl
}
