import React from 'react'
import clsx from 'clsx'

import styles from './Paper.module.css'

interface PaperProps {
  className?: string
}

const Paper: React.FC<PaperProps> = ({ className, children }) => {
  return (
    <div
      className={clsx(styles.container, {
        [className!]: !!className
      })}
    >
      {children}
    </div>
  )
}

export default Paper
