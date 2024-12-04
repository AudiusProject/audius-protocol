import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

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

  return isMobile ? (
    <MobileSettingsPage subPage={subPage} />
  ) : (
    <DesktopSettingsPage />
  )
}

export default SettingsPage
