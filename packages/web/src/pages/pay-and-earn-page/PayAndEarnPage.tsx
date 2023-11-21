import { useIsMobile } from 'utils/clientUtil'

import { PayAndEarnPage as DesktopPayAndEarn } from './desktop/PayAndEarnPage'
import { PayAndEarnPage as MobilePayAndEarn } from './mobile/PayAndEarnPage'
import { PayAndEarnPageProps } from './types'

export const PayAndEarnPage = (props: PayAndEarnPageProps) => {
  const isMobile = useIsMobile()
  const Content = isMobile ? MobilePayAndEarn : DesktopPayAndEarn

  return <Content {...props} />
}
