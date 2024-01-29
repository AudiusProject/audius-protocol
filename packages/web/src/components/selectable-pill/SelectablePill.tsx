import { ReactNode } from 'react'

import cn from 'classnames'

import { useIsMobile } from 'hooks/useIsMobile'

import styles from './SelectablePill.module.css'

type SelectablePillProps = {
  content: ReactNode
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
  const isMobile = useIsMobile()
  const wrappedOnClick = () => {
    !isSelected && onClick()
  }

  return (
    <div
      onClick={wrappedOnClick}
      className={cn(styles.pill, {
        [styles.selectedPill]: isSelected,
        [className!]: !!className,
        [styles.isMobile]: isMobile
      })}
    >
      {content}
    </div>
  )
}

export default SelectablePill
