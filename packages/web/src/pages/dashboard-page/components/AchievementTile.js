import { memo } from 'react'

import { IconTrophy } from '@audius/harmony'

import styles from './AchievementTile.module.css'

const getAchievement = () => {
  // TODO: Use some information about the artist to calculate the 'achievement'
  return { value: '300', valueLabel: 'th', label: 'Most Played' }
}

const AchievementTile = (props) => {
  const { value, valueLabel, label } = getAchievement(props.artistStats)
  return (
    <div className={styles.achievementTileContainer}>
      <IconTrophy className={styles.achievementTrophy} />
      <div className={styles.achievementDescription}>
        <div className={styles.achievementMetric}>
          <span className={styles.achievementValue}>{value}</span>
          {valueLabel && (
            <span className={styles.achievementValueLabel}>{valueLabel}</span>
          )}
        </div>
        <span className={styles.achievementLabel}>{label}</span>
      </div>
    </div>
  )
}

export default memo(AchievementTile)
