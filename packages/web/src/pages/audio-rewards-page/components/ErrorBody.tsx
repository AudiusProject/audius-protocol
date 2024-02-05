import { ReactNode } from 'react'

import { Scrollbar } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

import styles from './ErrorBody.module.css'

const messages = {
  okay: 'OKAY'
}

type ErrorBodyProps = {
  className?: string
  error: ReactNode
  onClose: () => void
}

const ErrorBody = ({ error, className, onClose }: ErrorBodyProps) => {
  return (
    <div className={cn(styles.container, { [className!]: !!className })}>
      <Scrollbar className={styles.scrollableMessage}>{error}</Scrollbar>
      <Button
        className={styles.btn}
        text={messages.okay}
        type={ButtonType.PRIMARY_ALT}
        onClick={onClose}
      />
    </div>
  )
}

export default ErrorBody
