import { MobileOS } from '@audius/common/models'
import { route } from '@audius/common/utils'

import { getMobileOS } from './clientUtil'
const { IOS_APP_STORE_LINK, IOS_WEBSITE_STORE_LINK } = route

export const getIOSAppLink = () => {
  const os = getMobileOS()
  if (os === MobileOS.IOS) {
    return IOS_APP_STORE_LINK
  } else {
    return IOS_WEBSITE_STORE_LINK
  }
}
