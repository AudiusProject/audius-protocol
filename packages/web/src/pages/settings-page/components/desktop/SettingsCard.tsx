import styles from './SettingsCard.module.css'

const SettingsCard = (props: SettingsCardProps) => {
  return (
    <div className={styles.settingsCard}>
      <div className={styles.content}>
        <div className={styles.title}>{props.title}</div>
        <div className={styles.description}>{props.description}</div>
      </div>
      {props.children}
    </div>
  )
}

type SettingsCardProps = {
  title: string
  description: string
  children: JSX.Element
}

export default SettingsCard
