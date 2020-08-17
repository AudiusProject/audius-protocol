import React from 'react'

import styles from './NoConnectivityPage.module.css'
import NoConnectivityContent from './NoConnectivityContent'

const NoConnectivityPage = () => {
  return (
    <div className={styles.container}>
      <NoConnectivityContent />
    </div>
  )
}

export default NoConnectivityPage
