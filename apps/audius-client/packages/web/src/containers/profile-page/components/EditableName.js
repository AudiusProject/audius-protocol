import React, { memo, useState, useRef, useEffect } from 'react'
import styles from './EditableName.module.css'
import cn from 'classnames'

import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import { ReactComponent as IconPencil } from 'assets/img/iconPencil.svg'

const EditableName = props => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => {
    if (editing) inputRef.current.focus()
  })

  const onInputBlur = () => {
    setEditing(false)
    props.onChange(inputRef.current.value)
  }

  return (
    <div className={cn(styles.name, props.className)}>
      {props.editable ? (
        editing ? (
          <>
            <input
              ref={inputRef}
              defaultValue={props.name || ''}
              onBlur={onInputBlur}
              maxLength='32'
            />
          </>
        ) : (
          <div className={styles.editNameContainer}>
            <span className={styles.editingName}>{props.name}</span>
            {
              <span
                className={styles.iconPencil}
                onClick={() => setEditing(true)}
              >
                <IconPencil />
              </span>
            }
          </div>
        )
      ) : (
        <>
          <h1>{props.name}</h1>
          {props.verified ? (
            <span className={styles.iconVerified}>
              <IconVerified />
            </span>
          ) : null}
        </>
      )}
    </div>
  )
}

export default memo(EditableName)
