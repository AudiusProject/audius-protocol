import React, { ReactNode } from 'react'
import styles from './ErrorBody.module.css'
import cn from 'classnames'
import { Button, ButtonType } from '@audius/stems'
import SimpleBar from 'simplebar-react'

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
      <SimpleBar className={styles.scrollableMessage}>{error}</SimpleBar>
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
