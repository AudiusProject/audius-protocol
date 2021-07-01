import React from 'react'

import cn from 'classnames'

import styles from './Skeleton.module.css'

type SkeletonProps = {
  // Width (css string) of the skeleton to display. Default 100%.
  width?: string
  // Height (css string) of the skeleton to display. Default 100%.
  height?: string
  // Optional class name to pass in and override styles with
  className?: string
}

const Skeleton = ({ width, height, className }: SkeletonProps) => {
  return (
    <div
      className={cn(styles.skeleton, className)}
      style={{
        width,
        height
      }}
    />
  )
}

export default Skeleton
