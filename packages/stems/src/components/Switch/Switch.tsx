import { ComponentProps } from 'react'

import cn from 'classnames'

import styles from './Switch.module.css'

export type SwitchProps = ComponentProps<'input'>

/**
 * @deprecated use @audius/harmony Switch instead
 */
export const Switch = (props: SwitchProps) => {
  const { disabled } = props
  return (
    <span className={cn(styles.root, { [styles.disabled]: disabled })}>
      <input className={styles.input} type='checkbox' {...props} />
      <span className={styles.switchTrack}>
        <span className={styles.switchThumb} />
      </span>
    </span>
  )
}
