import { memo, useState, useRef, useEffect } from 'react'

import { IconPencil } from '@audius/harmony'
import cn from 'classnames'

import UserBadges from 'components/user-badges/UserBadges'

import styles from './EditableName.module.css'

const EditableName = (props) => {
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
                <IconPencil color='staticWhite' />
              </span>
            }
          </div>
        )
      ) : (
        <>
          <h1>{props.name}</h1>
          <UserBadges
            userId={props.userId}
            badgeSize={24}
            className={styles.iconVerified}
            useSVGTiers
          />
        </>
      )}
    </div>
  )
}

export default memo(EditableName)
