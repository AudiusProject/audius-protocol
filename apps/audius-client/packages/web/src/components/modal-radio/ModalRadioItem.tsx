import { ReactNode, useContext, useEffect, useState } from 'react'

import { RadioButton, RadioGroupContext } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import useMeasure from 'react-use-measure'

import styles from './ModalRadioItem.module.css'

type ModalRadioItemProps = {
  label: string
  title?: ReactNode
  description: ReactNode
  value: any
  disabled?: boolean
  icon?: ReactNode
  checkedContent?: ReactNode
}

export const ModalRadioItem = (props: ModalRadioItemProps) => {
  const { icon, label, title, description, value, disabled, checkedContent } =
    props
  const [isCollapsed, setIsCollapsed] = useState(true)
  const radioGroup = useContext(RadioGroupContext)

  const [ref, bounds] = useMeasure({
    polyfill: ResizeObserver,
    offsetSize: true
  })

  useEffect(() => {
    if (radioGroup) {
      const isChecked = String(value) === String(radioGroup.value)
      if (isCollapsed === isChecked) {
        setIsCollapsed(!isChecked)
      }
    }
  }, [radioGroup, isCollapsed, value, setIsCollapsed])

  return (
    <label className={cn(styles.root)}>
      <RadioButton
        className={styles.radio}
        inputClassName={styles.input}
        aria-label={label}
        value={value}
        disabled={disabled}
      />
      <div className={styles.labelContent}>
        <div className={styles.optionTitle}>
          {icon}
          <span>{title ?? label}</span>
        </div>
        <div className={styles.optionDescription}>{description}</div>
        {checkedContent ? (
          <div
            className={styles.collapsibleContainer}
            style={{ height: isCollapsed ? 0 : bounds.height }}
            aria-hidden={isCollapsed}
          >
            <div ref={ref} className={styles.checkedContent}>
              {checkedContent}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  )
}
