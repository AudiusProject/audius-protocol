import React from 'react'

import clsx from 'clsx'

import styles from './Loading.module.css'

interface LoadingProps {
  className?: string
}

const Loading: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div
      className={clsx(styles.container, { [className!]: !!className })}
    ></div>
  )
}

export default Loading
