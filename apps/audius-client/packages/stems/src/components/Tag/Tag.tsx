import cn from 'classnames'
import { Link, LinkProps } from 'react-router-dom'

import styles from './Tag.module.css'

export type TagProps = LinkProps & {
  tag: string
}

export const Tag = (props: TagProps) => {
  const { tag, className, onClick, ...linkProps } = props

  const style = {
    [styles.clickable]: !!onClick
  }

  return (
    <Link
      className={cn(className, styles.tag, style)}
      onClick={onClick}
      {...linkProps}
    >
      <span className={styles.textLabel}>{tag}</span>
    </Link>
  )
}
