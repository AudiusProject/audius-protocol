import providerStyles from '../PlayBarProvider.module.css'

import styles from './PlayBar.module.css'

type ServerPlayBarProps = {
  isMobile: boolean
}

export const ServerPlayBar = ({ isMobile }: ServerPlayBarProps) => {
  if (isMobile) return null

  return (
    <div className={providerStyles.playBarWrapper}>
      <div className={providerStyles.customHr} />
      <div className={styles.playBar}>
        <div className={styles.playBarContentWrapper}></div>
      </div>
    </div>
  )
}
