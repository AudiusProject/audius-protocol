import cn from 'classnames'

import styles from './SettingsCard.module.css'

type SettingsCardProps = {
  className?: string
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

export const SettingsCard = (props: SettingsCardProps) => {
  return (
    <div className={cn(styles.settingsCard, props.className)}>
      <div>
        <div className={styles.title}>
          {props.icon} {props.title}
        </div>
        <div className={styles.description}>{props.description}</div>
      </div>
      {props.children}
    </div>
  )
}

export default SettingsCard
