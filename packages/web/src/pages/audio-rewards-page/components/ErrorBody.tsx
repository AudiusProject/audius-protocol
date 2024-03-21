import { ReactNode } from 'react'

import { Button, Scrollbar } from '@audius/harmony'
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
        variant='primary'
        css={(theme) => ({
          marginBottom: theme.spacing.xl
        })}
        onClick={onClose}
      >
        {messages.okay}
      </Button>
    </div>
  )
}

export default ErrorBody
