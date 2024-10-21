import cn from 'classnames'

import styles from './SettingsCard.module.css'

type SettingsCardProps = {
  className?: string
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
  isFull?: boolean
}

export const SettingsCard = (props: SettingsCardProps) => {
  const settingsCardStyle = cn(
    styles.settingsCard,
    { [styles.settingsCardFull]: props.isFull },
    props.className
  )
  return (
    <div className={settingsCardStyle}>
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
