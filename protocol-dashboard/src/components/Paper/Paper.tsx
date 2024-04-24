import React from 'react'

import clsx from 'clsx'

import styles from './Paper.module.css'

interface PaperProps {
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

const Paper = ({ className, children, onClick = () => {} }: PaperProps) => {
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
