import { MouseEventHandler } from 'react'

import cn from 'classnames'

import styles from './Switch.module.css'

type SwitchProps = {
  isOn: boolean
  isDisabled?: boolean
  handleToggle: MouseEventHandler<Element>
  allowCheckedWhileDisabled?: boolean
}

const Switch = ({
  isOn,
  handleToggle,
  isDisabled = false,
  allowCheckedWhileDisabled
}: SwitchProps) => {
  return (
    <div className={cn(styles.container, { [styles.disabled]: isDisabled })}>
      <input
        checked={allowCheckedWhileDisabled ? isOn : isDisabled ? false : isOn}
        className={styles.inputCheckbox}
        type='checkbox'
      />
      <label className={styles.switchLabel} onClick={handleToggle}>
        <span className={styles.switchButton} />
      </label>
    </div>
  )
}

export default Switch
