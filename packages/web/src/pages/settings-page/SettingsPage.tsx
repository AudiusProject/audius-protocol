import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

import { SettingsPageProvider } from './SettingsPageProvider'
import { SettingsPage as DesktopSettingsPage } from './components/desktop/SettingsPage'
import {
  SettingsPage as MobileSettingsPage,
  SubPage
} from './components/mobile/SettingsPage'

type SettingsPageProps = {
  containerRef: RefObject<HTMLDivElement>
  subPage?: SubPage
}

const SettingsPage = ({ subPage }: SettingsPageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileSettingsPage : DesktopSettingsPage

  return (
    <SettingsPageProvider subPage={subPage}>{content}</SettingsPageProvider>
  )
}

export default SettingsPage
