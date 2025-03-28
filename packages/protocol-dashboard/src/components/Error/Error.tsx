import clsx from 'clsx'

import IconUhOh from 'assets/img/uhOh.svg'
import { BasicTooltip } from 'components/Tooltip/Tooltip'

import styles from './Error.module.css'

const DEFAULT_ERROR_TEXT = 'Incomplete Data'

const Error = ({
  text = DEFAULT_ERROR_TEXT,
  className
}: {
  text?: string
  className?: string
}) => {
  return (
    <div className={clsx(styles.error, className)}>
      <BasicTooltip text={text}>
        <IconUhOh className={styles.icon} />
      </BasicTooltip>
    </div>
  )
}

export default Error
