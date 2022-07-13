import { ReactNode } from 'react'

import cn from 'classnames'

import useDelayHandler from 'hooks/useDelayHandler'

import SelectablePill from './SelectablePill'
import styles from './SelectablePill.module.css'

type PillContainerProps = {
  content: ReactNode[]
  selectedIndex: number
  onClickIndex: (index: number) => void
  className?: string
  pillClassName?: string
  disableDelayHandler?: boolean
}

const ANIM_DELAY_MS = 200

const SelectablePills = ({
  content,
  selectedIndex,
  onClickIndex,
  className,
  pillClassName,
  disableDelayHandler = false
}: PillContainerProps) => {
  const { delayedHandler, computedState } = useDelayHandler(
    ANIM_DELAY_MS,
    onClickIndex,
    { selectedIndex }
  )

  const isSelectedIndex = disableDelayHandler
    ? selectedIndex
    : computedState.selectedIndex

  const onClick = (index: number) => {
    if (disableDelayHandler || index === content.length - 1) {
      return () => onClickIndex(index)
    } else {
      return () => delayedHandler({ selectedIndex: index }, index)
    }
  }

  return (
    <div
      className={cn(styles.pillContainer, {
        [className!]: !!className
      })}>
      {content.map((node, index) => (
        <SelectablePill
          className={pillClassName}
          content={node}
          isSelected={index === isSelectedIndex}
          onClick={onClick(index)}
          key={index}
        />
      ))}
    </div>
  )
}

export default SelectablePills
