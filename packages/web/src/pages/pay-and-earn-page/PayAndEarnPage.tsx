import { useIsMobile } from 'utils/clientUtil'

import { PayAndEarnPage as DesktopPayAndEarn } from './desktop/PayAndEarnPage'
import { PayAndEarnPage as MobilePayAndEarn } from './mobile/PayAndEarnPage'

export const PayAndEarnPage = () => {
  const isMobile = useIsMobile()
  const Content = isMobile ? MobilePayAndEarn : DesktopPayAndEarn

  return <Content />
}
