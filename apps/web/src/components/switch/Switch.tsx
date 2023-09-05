import cn from 'classnames'

import styles from './Switch.module.css'

type SwitchProps = {
  isOn: boolean
  isDisabled?: boolean
  handleToggle: () => void
}

const Switch = ({ isOn, handleToggle, isDisabled = false }: SwitchProps) => {
  return (
    <div className={cn(styles.container, { [styles.disabled]: isDisabled })}>
      <input
        checked={isDisabled ? false : isOn}
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
