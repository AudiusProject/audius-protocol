import styles from './TrackingBar.module.css'

type TrackingBarProps = {
  percentComplete: number
}

const TrackingBar = ({ percentComplete }: TrackingBarProps) => {
  return (
    <div className={styles.rail}>
      <div
        className={styles.tracker}
        style={{ width: `${percentComplete}%` }}
      />
    </div>
  )
}

export default TrackingBar
