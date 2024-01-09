import clsx from 'clsx'
import React, { useState } from 'react'

import { IconKebabHorizontal } from '@audius/stems'
import AppBar from 'components/AppBar'
import Nav from 'components/Nav'
import { useInit } from 'store/cache/protocol/hooks'
import { useIsMobile } from 'utils/hooks'

import MobileNav from 'components/MobileNav'
import { createStyles } from 'utils/mobile'
import desktopStyles from './Header.module.css'
import mobileStyles from './HeaderMobile.module.css'
import { StartListeningBanner } from 'components/StartListeningBanner/StartListeningBanner'

const styles = createStyles({ desktopStyles, mobileStyles })

interface HeaderProps {
  className?: string
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  useInit()
  const isMobile = useIsMobile()
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <div className={clsx(styles.container, { [className!]: !!className })}>
      {isMobile && (
        <>
          <div
            className={styles.mobileNav}
            onClick={() => setShowMobileNav(true)}
          >
            <IconKebabHorizontal />
          </div>
          <MobileNav
            isOpen={showMobileNav}
            onClose={() => setShowMobileNav(false)}
          />
        </>
      )}
      <div className={styles.bgImg}></div>
      <StartListeningBanner />
      <div className={styles.appBarContainer}>
        <AppBar />
      </div>
      {!isMobile && (
        <div className={styles.navContainer}>
          <Nav />
        </div>
      )}
    </div>
  )
}

export default Header
