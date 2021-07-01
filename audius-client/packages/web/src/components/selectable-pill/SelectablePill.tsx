import React from 'react'

import cn from 'classnames'

import { isMobile } from 'utils/clientUtil'

import styles from './SelectablePill.module.css'

type SelectablePillProps = {
  content: React.ReactNode
  isSelected: boolean
  onClick: () => void
  className?: string
}

const SelectablePill = ({
  content,
  isSelected,
  onClick,
  className
}: SelectablePillProps) => {
  const wrappedOnClick = () => {
    !isSelected && onClick()
  }

  return (
    <div
      onClick={wrappedOnClick}
      className={cn(styles.pill, {
        [styles.selectedPill]: isSelected,
        [className!]: !!className,
        [styles.isMobile]: isMobile()
      })}
    >
      {content}
    </div>
  )
}

export default SelectablePill
