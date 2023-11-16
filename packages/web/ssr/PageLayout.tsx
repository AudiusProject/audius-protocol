import React from 'react'

import '../src/index.css'

import styles from '../src/app/web-player/WebPlayer.module.css'
import navStyles from '../src/components/nav/desktop/LeftNav.module.css'
import cn from 'classnames'

// TODO: CSS vars aren't defined
// TODO: mobile

export function PageLayout({ children }) {
  return (
    <React.StrictMode>
      <div className={styles.root}>
        <div className={cn(styles.app)}>
          <div
            className={cn(navStyles.navWrapper, navStyles.leftNavWrapper)}
          ></div>
        </div>
        <div role='main' className={cn(styles.mainContentWrapper)}>
          {children}
        </div>
      </div>
    </React.StrictMode>
  )
}
