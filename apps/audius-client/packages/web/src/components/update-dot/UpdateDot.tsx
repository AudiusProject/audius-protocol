import React from 'react'

import { useIsMobile } from 'utils/clientUtil'

import styles from './UpdateDot.module.css'

const UpdateDot: React.FC = () => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <div className={styles.mobileUpdateDot} />
  ) : (
    <div className={styles.updateDot} />
  )
}

export default UpdateDot
