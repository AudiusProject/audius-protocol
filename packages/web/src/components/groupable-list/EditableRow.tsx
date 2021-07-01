import React, { ReactNode, useState } from 'react'

import cn from 'classnames'

import styles from './EditableRow.module.css'

export enum Format {
  INPUT = 'input',
  TEXT_AREA = 'textarea'
}

type EditableRowProps = {
  label: ReactNode | string
  format: Format
  initialValue?: string
  placeholderValue?: string
  onChange: (value: string) => void
  maxLength?: number
  stripLinksFromLength?: boolean
  inputPrefix?: string
  centerLeftElement?: boolean
  isDisabled?: boolean
}

const EditableRow = ({
  label,
  format,
  initialValue = '',
  placeholderValue = '',
  onChange,
  maxLength,
  inputPrefix,
  stripLinksFromLength,
  centerLeftElement = true,
  isDisabled = false
}: EditableRowProps) => {
  const [inputValue, setInputValue] = useState(initialValue)

  const handleOnChange = (e: any) => {
    if (maxLength && stripLinksFromLength) {
      const textWithoutLinks = e.target.value.replace(
        /(?:https?):\/\/[\n\S]+/g,
        ''
      )
      if (textWithoutLinks.length > maxLength) return
    }
    setInputValue(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div
      className={cn(styles.editableRow, {
        [styles.isDisabled]: isDisabled
      })}
    >
      <div
        className={cn(styles.left, {
          [styles.top]: !centerLeftElement
        })}
      >
        {label}
      </div>
      <div className={styles.right}>
        {format === Format.TEXT_AREA ? (
          <textarea
            className={styles.textarea}
            defaultValue={initialValue}
            onChange={handleOnChange}
            maxLength={maxLength}
            placeholder={placeholderValue}
            disabled={isDisabled}
          />
        ) : (
          <input
            className={cn(styles.input, {
              [styles.hasPrefix]: inputPrefix
            })}
            defaultValue={initialValue}
            value={stripLinksFromLength ? undefined : inputValue}
            onChange={handleOnChange}
            maxLength={stripLinksFromLength ? undefined : maxLength}
            placeholder={placeholderValue}
            disabled={isDisabled}
          />
        )}
        {inputPrefix && <div className={styles.prefix}>{inputPrefix}</div>}
      </div>
    </div>
  )
}

export default EditableRow
