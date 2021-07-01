import React, { ReactNode } from 'react'

import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import SimpleBar from 'simplebar-react'

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
