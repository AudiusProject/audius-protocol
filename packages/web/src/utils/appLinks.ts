import { MobileOS } from '@audius/common/models'
import {} from '@audius/common'

import { getMobileOS } from './clientUtil'
import { IOS_APP_STORE_LINK, IOS_WEBSITE_STORE_LINK } from './route'

export const getIOSAppLink = () => {
  const os = getMobileOS()
  if (os === MobileOS.IOS) {
    return IOS_APP_STORE_LINK
  } else {
    return IOS_WEBSITE_STORE_LINK
  }
}
