import cn from 'classnames'

import providerStyles from '../PlayBarProvider.module.css'

import styles from './PlayBar.module.css'

type ServerPlayBarProps = {
  isMobile: boolean
}

export const ServerPlayBar = ({ isMobile }: ServerPlayBarProps) => {
  return (
    <div
      className={cn(providerStyles.playBarWrapper, {
        [providerStyles.isMobile]: isMobile
      })}
    >
      <div className={providerStyles.customHr} />
      <div className={cn(styles.playBar, { [styles.isMobile]: isMobile })}>
        <div className={styles.playBarContentWrapper}></div>
      </div>
    </div>
  )
}
