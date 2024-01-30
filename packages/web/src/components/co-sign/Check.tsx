import cn from 'classnames'

import { IconCosign as IconCoSign } from '@audius/harmony'

import styles from './Check.module.css'
import { Size } from './types'

type CheckProps = {
  size: Size
}

const Check = ({ size }: CheckProps) => {
  return (
    <div
      className={cn(styles.box, {
        [styles.tiny]: size === Size.TINY,
        [styles.small]: size === Size.SMALL,
        [styles.medium]: size === Size.MEDIUM,
        [styles.large]: size === Size.LARGE,
        [styles.xlarge]: size === Size.XLARGE
      })}
    >
      <IconCoSign className={styles.iconCoSign} />
    </div>
  )
}

export default Check
