import { ReactNode } from 'react'

import cn from 'classnames'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'

import styles from './Row.module.css'

type RowProps = {
  // Leading image, emoji, icon, etc.
  prefix?: ReactNode
  // Title area of a Row component, may be left unset
  title?: string
  // Body area of a Row component, may be left unset
  body?: string
  children?: ReactNode
  // Whether or not to pad the children and body
  includeSpacing?: boolean
  // Adds an arrow to the row component if `onClick` is provided
  onClick?: () => void
}

/**
 * A row component to be used within a <Grouping />
 */
const Row = ({
  prefix,
  title,
  body,
  children,
  onClick,
  includeSpacing = true
}: RowProps) => {
  return (
    <div
      className={cn(styles.row, {
        [styles.isClickable]: !!onClick,
        [styles.hasBody]: !!children,
        [styles.includeSpacing]: includeSpacing
      })}
      onClick={onClick}
    >
      <div className={styles.content}>
        {title && (
          <div className={styles.title}>
            {prefix}
            <div className={styles.text}>{title}</div>
          </div>
        )}
        {(body || children) && (
          <div className={styles.body}>
            {body}
            {children && <div className={styles.children}>{children}</div>}
          </div>
        )}
      </div>
      {onClick && <IconCaretRight className={styles.iconCaretRight} />}
    </div>
  )
}

export default Row
