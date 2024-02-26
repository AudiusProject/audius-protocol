import React, { useState } from 'react'

import { IconKebabHorizontal } from '@audius/stems'
import clsx from 'clsx'

import AppBar from 'components/AppBar'
import MobileNav from 'components/MobileNav'
import Nav from 'components/Nav'
import { StartListeningBanner } from 'components/StartListeningBanner/StartListeningBanner'
import { useInit } from 'store/cache/protocol/hooks'
import { useIsMobile } from 'utils/hooks'
import { createStyles } from 'utils/mobile'

import desktopStyles from './Header.module.css'
import mobileStyles from './HeaderMobile.module.css'

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
