import { ReactNode, useContext, useEffect, useState } from 'react'

import { Tag } from '@audius/harmony'
import { RadioButton, RadioGroupContext } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
import useMeasure from 'react-use-measure'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'

import styles from './ModalRadioItem.module.css'

type ModalRadioItemProps = {
  label: string
  title?: ReactNode
  description?: ReactNode
  hintContent?: string | ReactNode
  hintIcon?: ReactNode
  tag?: string
  value: any
  disabled?: boolean
  icon?: ReactNode
  checkedContent?: ReactNode
}

export const ModalRadioItem = (props: ModalRadioItemProps) => {
  const {
    icon,
    label,
    hintContent,
    hintIcon,
    tag,
    title,
    description,
    value,
    disabled,
    checkedContent
  } = props
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
    <label
      className={cn(styles.root, layoutStyles.col, layoutStyles.gap2, {
        [styles.disabled]: disabled
      })}
    >
      <div className={cn(layoutStyles.row, layoutStyles.gap4)}>
        <RadioButton
          className={styles.radio}
          inputClassName={styles.input}
          aria-label={label}
          value={value}
          disabled={disabled}
        />
        <Text className={styles.optionTitle} variant='title' size='large'>
          {icon}
          <span>{title ?? label}</span>
        </Text>
        {tag ? <Tag className={styles.tag}>{tag}</Tag> : null}
      </div>
      {hintContent ? (
        <HelpCallout icon={hintIcon} content={hintContent} />
      ) : null}
      {checkedContent || description ? (
        <div
          className={cn(styles.collapsibleContainer, {
            [styles.collapsed]: isCollapsed
          })}
          style={{ height: isCollapsed ? 0 : bounds.height }}
          aria-hidden={isCollapsed}
        >
          <div ref={ref} className={cn(layoutStyles.col, layoutStyles.gap4)}>
            {typeof description === 'string' ? (
              <Text>{description}</Text>
            ) : (
              description
            )}
            {checkedContent}
          </div>
        </div>
      ) : null}
    </label>
  )
}
