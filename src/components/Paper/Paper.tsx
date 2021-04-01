import React from 'react'
import clsx from 'clsx'

import styles from './Paper.module.css'

interface PaperProps {
  className?: string
  onClick?: () => void
}

const Paper: React.FC<PaperProps> = ({ className, children, onClick = () => {} }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(styles.container, {
        [className!]: !!className
      })}
    >
      {children}
    </div>
  )
}

export default Paper
