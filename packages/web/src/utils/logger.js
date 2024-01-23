import { env } from 'services/env'

/* eslint-disable no-console */
const preserveLogs =
  window.localStorage && window.localStorage.getItem('preserve-logs')

export const storeLogger = (store) => {
  if (env.ENVIRONMENT === 'production' && !preserveLogs) {
    console.log('%cStop!', 'color: red; font-size: 56px; font-weight: bold;')
    console.log(
      `%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or "hack" someone's account, it is a scam and will give them access to your Audius account.`,
      'color: grey; font-size: 16px; font-weight: bold;'
    )
  }
}

export default storeLogger
