import React from 'react'
import styles from './UpdateDot.module.css'
import { useIsMobile } from 'utils/clientUtil'

const UpdateDot: React.FC = () => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <div className={styles.mobileUpdateDot} />
  ) : (
    <div className={styles.updateDot} />
  )
}

export default UpdateDot
