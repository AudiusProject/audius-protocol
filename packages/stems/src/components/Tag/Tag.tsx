import { ComponentProps, ElementType } from 'react'

import cn from 'classnames'

import styles from './Tag.module.css'

const defaultElement = 'span'

type TagOwnProps<TagElementType extends ElementType = ElementType> = {
  tag: string
  as?: TagElementType
}

export type TagProps<TagComponentType extends ElementType> =
  TagOwnProps<TagComponentType> &
    Omit<ComponentProps<TagComponentType>, keyof TagOwnProps>

/**
 * @deprecated use `@audius/harmony` tag instead
 */
export const Tag = <TagElementType extends ElementType = typeof defaultElement>(
  props: TagProps<TagElementType>
) => {
  const { tag, as: Component = defaultElement, className, ...other } = props

  const style = {
    [styles.clickable]: !!other.onClick
  }

  return (
    <Component className={cn(className, styles.tag, style)} {...other}>
      <span className={styles.textLabel}>{tag}</span>
    </Component>
  )
}
