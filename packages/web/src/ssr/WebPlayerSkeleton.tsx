import React from 'react'

import '../index.css'

import cn from 'classnames'

import AudiusLogoHorizontal from 'assets/img/audiusLogoHorizontal.svg'
import navStyles from 'components/nav/Navigator.module.css'
import leftNavStyles from 'components/nav/desktop/LeftNav.module.css'
import navHeaderStyles from 'components/nav/desktop/NavHeader.module.css'
import { HOME_PAGE } from 'utils/route'

import styles from '../app/web-player/WebPlayer.module.css'

const messages = {
  homeLink: 'Go to Home'
}

// TODO: mobile
// TODO: convert to emotion
export function WebPlayerSkeleton({ children }) {
  return (
    <React.StrictMode>
      <div className={styles.root}>
        <div className={cn(styles.app)}>
          <div className={cn(navStyles.navWrapper, navStyles.leftNavWrapper)}>
            <nav className={leftNavStyles.leftNav}>
              <div className={navHeaderStyles.header}>
                <a href={HOME_PAGE} aria-label={messages.homeLink}>
                  <AudiusLogoHorizontal className={cn(navHeaderStyles.logo)} />
                </a>
              </div>
            </nav>
          </div>
          <div role='main' className={cn(styles.mainContentWrapper)}>
            {children}
          </div>
          {/* playbar */}
        </div>
      </div>
    </React.StrictMode>
  )
}
