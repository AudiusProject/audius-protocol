import { Button, ButtonProps } from '@audius/stems'

import styles from './LabeledButton.module.css'

type LabeledButtonProps = {
  label: string
} & ButtonProps

const LabeledButton = ({ label, ...restProps }: LabeledButtonProps) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>{label}</div>
      <Button {...restProps} />
    </div>
  )
}

export default LabeledButton
