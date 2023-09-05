import { useIsMobile } from 'utils/clientUtil'

import styles from './UpdateDot.module.css'

const UpdateDot = () => {
  const isMobile = useIsMobile()

  return isMobile ? (
    <div className={styles.mobileUpdateDot} />
  ) : (
    <div className={styles.updateDot} />
  )
}

export default UpdateDot
