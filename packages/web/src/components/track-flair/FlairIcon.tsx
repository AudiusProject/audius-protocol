import { IconComponent } from '@audius/harmony'
import cn from 'classnames'

import styles from './FlairIcon.module.css'
import { Size } from './types'

type CheckProps = {
  size: Size
  Icon: IconComponent
}

const FlairIcon = ({ size, Icon }: CheckProps) => {
  return (
    <div
      className={cn(styles.boxBorder, {
        [styles.tiny]: size === Size.TINY,
        [styles.small]: size === Size.SMALL,
        [styles.medium]: size === Size.MEDIUM,
        [styles.large]: size === Size.LARGE,
        [styles.xlarge]: size === Size.XLARGE
      })}
    >
      <div
        className={cn(styles.box, {
          [styles.tiny]: size === Size.TINY,
          [styles.small]: size === Size.SMALL,
          [styles.medium]: size === Size.MEDIUM,
          [styles.large]: size === Size.LARGE,
          [styles.xlarge]: size === Size.XLARGE
        })}
      >
        <Icon className={styles.icon} />
      </div>
    </div>
  )
}

export default FlairIcon
